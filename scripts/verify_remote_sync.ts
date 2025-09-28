import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

type DevToArticle = {
  id: number;
  title: string;
  body_markdown: string;
  url?: string;
  published?: boolean;
  updated_at?: string;
  published_at?: string | null;
  published_timestamp?: string | null;
};

type QiitaItem = {
  id: string;
  title: string;
  body: string;
  url?: string;
  private: boolean;
  updated_at?: string;
};

type PostMapEntry = {
  id: number | string;
  url?: string;
  updatedAt?: string;
  published?: boolean;
  publishedAt?: string;
};

type PostMap = Record<string, PostMapEntry>;

type VerificationError = {
  file: string;
  message: string;
};

const DEVTO_API_BASE = 'https://dev.to/api/articles';
const QIITA_API_BASE = 'https://qiita.com/api/v2/items';

const normalize = (value: string): string => value.replace(/\r\n/g, '\n').trim();

const loadPostMap = (mapPath: string): PostMap => {
  try {
    const raw = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(raw) as PostMap;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

const readLocalArticle = (relativePath: string): { title: string; content: string } => {
  const absolutePath = path.resolve(relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Local file ${relativePath} referenced in map is missing.`);
  }
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsed = matter(raw);
  const title = typeof parsed.data.title === 'string' ? parsed.data.title : '';
  const content = normalize(parsed.content);
  return { title, content };
};

const fetchDevToArticle = async (id: number, token: string): Promise<DevToArticle> => {
  const response = await fetch(`${DEVTO_API_BASE}/${id}`, {
    headers: {
      'api-key': token,
      'User-Agent': 'article-sync-verifier'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch dev.to article ${id}: ${response.status} ${response.statusText} - ${body}`);
  }

  return (await response.json()) as DevToArticle;
};

const fetchQiitaItem = async (id: string, token: string): Promise<QiitaItem> => {
  const response = await fetch(`${QIITA_API_BASE}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'article-sync-verifier'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Qiita item ${id}: ${response.status} ${response.statusText} - ${body}`);
  }

  return (await response.json()) as QiitaItem;
};

const verifyDevToEntries = async (map: PostMap, token: string): Promise<VerificationError[]> => {
  const errors: VerificationError[] = [];

  for (const [relativePath, entry] of Object.entries(map)) {
    try {
      const local = readLocalArticle(relativePath);
      const article = await fetchDevToArticle(Number(entry.id), token);

      if (normalize(article.body_markdown) !== local.content) {
        errors.push({
          file: relativePath,
          message: 'Local markdown content does not match remote dev.to article. Run the publish script to sync it.'
        });
      }

      if (article.title.trim() !== local.title.trim()) {
        errors.push({
          file: relativePath,
          message: 'Local title does not match remote dev.to article title.'
        });
      }

      const remotePublished =
        typeof article.published === 'boolean'
          ? article.published
          : Boolean(article.published_at ?? article.published_timestamp);

      if (typeof entry.published === 'boolean' && entry.published !== remotePublished) {
        errors.push({
          file: relativePath,
          message: 'Stored published flag for dev.to entry is out of sync with remote state.'
        });
      }

      const remotePublishedAt = article.published_at ?? article.published_timestamp ?? undefined;
      if (entry.publishedAt && remotePublishedAt && entry.publishedAt !== remotePublishedAt) {
        errors.push({
          file: relativePath,
          message: 'Stored dev.to publishedAt differs from remote published timestamp.'
        });
      }

      if (entry.url && article.url && entry.url !== article.url) {
        errors.push({
          file: relativePath,
          message: 'Stored dev.to URL differs from remote URL.'
        });
      }

      if (entry.updatedAt && article.updated_at && entry.updatedAt !== article.updated_at) {
        errors.push({
          file: relativePath,
          message: 'Stored dev.to updatedAt differs from remote updated_at timestamp.'
        });
      }
    } catch (error) {
      errors.push({ file: relativePath, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return errors;
};

const verifyQiitaEntries = async (map: PostMap, token: string): Promise<VerificationError[]> => {
  const errors: VerificationError[] = [];

  for (const [relativePath, entry] of Object.entries(map)) {
    try {
      const local = readLocalArticle(relativePath);
      const item = await fetchQiitaItem(String(entry.id), token);

      if (normalize(item.body) !== local.content) {
        errors.push({
          file: relativePath,
          message: 'Local markdown content does not match remote Qiita article. Run the publish script to sync it.'
        });
      }

      if (item.title.trim() !== local.title.trim()) {
        errors.push({
          file: relativePath,
          message: 'Local title does not match remote Qiita article title.'
        });
      }

      const remotePublished = !item.private;
      if (typeof entry.published === 'boolean' && entry.published !== remotePublished) {
        errors.push({
          file: relativePath,
          message: 'Stored published flag for Qiita entry is out of sync with remote state.'
        });
      }

      if (entry.url && item.url && entry.url !== item.url) {
        errors.push({
          file: relativePath,
          message: 'Stored Qiita URL differs from remote URL.'
        });
      }

      if (entry.updatedAt && item.updated_at && entry.updatedAt !== item.updated_at) {
        errors.push({
          file: relativePath,
          message: 'Stored Qiita updatedAt differs from remote updated_at timestamp.'
        });
      }
    } catch (error) {
      errors.push({ file: relativePath, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return errors;
};

const main = async (): Promise<void> => {
  const devToToken = process.env.DEVTO_API_KEY;
  const qiitaToken = process.env.QIITA_TOKEN;

  if (!devToToken) {
    throw new Error('DEVTO_API_KEY is not set.');
  }
  if (!qiitaToken) {
    throw new Error('QIITA_TOKEN is not set.');
  }

  const devToMap = loadPostMap('.posts-map.devto.json');
  const qiitaMap = loadPostMap('.posts-map.qiita.json');

  const [devToErrors, qiitaErrors] = await Promise.all([
    verifyDevToEntries(devToMap, devToToken),
    verifyQiitaEntries(qiitaMap, qiitaToken)
  ]);

  const allErrors = [...devToErrors, ...qiitaErrors];

  if (allErrors.length > 0) {
    console.error('Detected remote publishing inconsistencies:');
    for (const error of allErrors) {
      console.error(`- ${error.file}: ${error.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('All remote articles are in sync with local markdown and post maps.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
