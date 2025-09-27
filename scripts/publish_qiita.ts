import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

type FrontMatter = {
  title?: string;
  published?: boolean;
  tags?: string[] | string;
  canonical_url?: string;
  cover_image?: string;
  series?: string;
  platform?: string | string[];
  qiita_org?: string;
};

type PostMapEntry = {
  id: string;
  url?: string;
  updatedAt?: string;
};

type PostMap = Record<string, PostMapEntry>;

const API_BASE = 'https://qiita.com/api/v2';
const MAP_FILE = '.posts-map.qiita.json';

const wantsQiita = (platform: FrontMatter['platform']): boolean => {
  if (!platform) return true;
  if (typeof platform === 'string') {
    const normalized = platform.toLowerCase();
    if (normalized === 'auto') return true;
    return normalized.split(',').map((token) => token.trim()).includes('qiita');
  }
  return platform.map((token) => token.toLowerCase()).includes('qiita');
};

const ensureArrayOfStrings = (value: FrontMatter['tags']): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item));
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const toQiitaTags = (tags?: string[]): { name: string; versions: string[] }[] => {
  if (!tags) return [];
  return tags.map((tag) => ({ name: tag, versions: [] }));
};

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

const savePostMap = (mapPath: string, data: PostMap): void => {
  fs.writeFileSync(mapPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
};

const createOrUpdateQiitaItem = async (
  token: string,
  existingId: string | undefined,
  payload: unknown,
): Promise<{ id: string; url?: string; updated_at?: string }> => {
  const pathSegment = existingId ? `/items/${existingId}` : '/items';
  const method = existingId ? 'PATCH' : 'POST';

  const response = await fetch(`${API_BASE}${pathSegment}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'article-publisher-script'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Qiita API request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return (await response.json()) as { id: string; url?: string; updated_at?: string };
};

const main = async (): Promise<void> => {
  const token = process.env.QIITA_TOKEN;
  if (!token) {
    throw new Error('QIITA_TOKEN is not set.');
  }

  const fileArgs = process.argv.slice(2);
  if (fileArgs.length === 0) {
    console.log('No content files provided. Nothing to do.');
    return;
  }

  const mapPath = path.resolve(MAP_FILE);
  const postMap = loadPostMap(mapPath);

  for (const fileArg of fileArgs) {
    const absolutePath = path.resolve(fileArg);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Skipped: ${fileArg} (file not found)`);
      continue;
    }

    const relativePath = path.relative(process.cwd(), absolutePath);
    const rawMarkdown = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = matter(rawMarkdown);
    const frontMatter = parsed.data as FrontMatter;

    if (!frontMatter.title) {
      console.warn(`Skipped: ${relativePath} (missing required front matter field: title)`);
      continue;
    }

    if (!wantsQiita(frontMatter.platform)) {
      console.log(`Skipped: ${relativePath} (platform excludes Qiita)`);
      continue;
    }

    const tags = ensureArrayOfStrings(frontMatter.tags);

    const itemPayload = {
      title: frontMatter.title,
      body: parsed.content.trim(),
      tags: toQiitaTags(tags),
      private: !frontMatter.published,
      coediting: false,
      group_url_name: frontMatter.qiita_org,
      tweet: false
    };

    try {
      const existingEntry = postMap[relativePath];
      const apiResponse = await createOrUpdateQiitaItem(token, existingEntry?.id, itemPayload);
      postMap[relativePath] = {
        id: apiResponse.id,
        url: apiResponse.url,
        updatedAt: apiResponse.updated_at
      };
      console.log(`${existingEntry ? 'Updated' : 'Created'} Qiita draft: ${frontMatter.title}`);
    } catch (error) {
      console.error(`Failed to publish ${relativePath}: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  }

  savePostMap(mapPath, postMap);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
