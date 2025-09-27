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
  organization_id?: number;
  platform?: string | string[];
};

type PostMapEntry = {
  id: number;
  url?: string;
  updatedAt?: string;
};

type PostMap = Record<string, PostMapEntry>;

const API_BASE = 'https://dev.to/api';
const MAP_FILE = '.posts-map.devto.json';

const wantsDevTo = (platform: FrontMatter['platform']): boolean => {
  if (!platform) return true;
  if (typeof platform === 'string') {
    const normalized = platform.toLowerCase();
    if (normalized === 'auto') return true;
    return normalized.split(',').map((token) => token.trim()).includes('devto');
  }
  return platform.map((token) => token.toLowerCase()).includes('devto');
};

const ensureArrayOfStrings = (value: FrontMatter['tags']): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item));
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
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

const createOrUpdateArticle = async (
  token: string,
  existingId: number | undefined,
  payload: unknown,
): Promise<{ id: number; url?: string; updated_at?: string }> => {
  const url = existingId ? `${API_BASE}/articles/${existingId}` : `${API_BASE}/articles`;
  const method = existingId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'api-key': token,
      'User-Agent': 'article-publisher-script'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`dev.to API request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return (await response.json()) as { id: number; url?: string; updated_at?: string };
};

const main = async (): Promise<void> => {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    throw new Error('DEVTO_API_KEY is not set.');
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

    if (!wantsDevTo(frontMatter.platform)) {
      console.log(`Skipped: ${relativePath} (platform excludes dev.to)`);
      continue;
    }

    const tags = ensureArrayOfStrings(frontMatter.tags);

    const articlePayload = {
      article: {
        title: frontMatter.title,
        published: Boolean(frontMatter.published),
        body_markdown: parsed.content.trim(),
        tags,
        canonical_url: frontMatter.canonical_url,
        cover_image: frontMatter.cover_image,
        series: frontMatter.series,
        organization_id: frontMatter.organization_id
      }
    };

    try {
      const existingEntry = postMap[relativePath];
      const apiResponse = await createOrUpdateArticle(apiKey, existingEntry?.id, articlePayload);
      postMap[relativePath] = {
        id: apiResponse.id,
        url: apiResponse.url,
        updatedAt: apiResponse.updated_at
      };
      console.log(`${existingEntry ? 'Updated' : 'Created'} dev.to draft: ${frontMatter.title}`);
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
