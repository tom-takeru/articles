import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

type HttpError = Error & { status?: number };

const createHttpError = (message: string, status?: number): HttpError => {
  const error = new Error(message) as HttpError;
  if (typeof status === 'number') {
    error.status = status;
  }
  return error;
};

type FrontMatter = {
  title?: string;
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
  published?: boolean;
};

type PostMap = Record<string, PostMapEntry>;

const API_BASE = 'https://dev.to/api';
const MAP_FILE = '.posts-map.devto.json';

const resolvePublishFlag = (): boolean => {
  const mode = (process.env.PUBLISH_MODE ?? 'draft').toLowerCase();
  if (['publish', 'published', 'release', 'public'].includes(mode)) {
    return true;
  }
  if (['draft', 'preview', 'dry-run'].includes(mode)) {
    return false;
  }
  console.warn(`Unknown PUBLISH_MODE "${mode}". Falling back to draft.`);
  return false;
};

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
): Promise<{ id: number; url?: string; updated_at?: string; published?: boolean }> => {
  const url = existingId ? `${API_BASE}/articles/${existingId}` : `${API_BASE}/articles`;
  const method = existingId ? 'PUT' : 'POST';

  if (process.env.SIMULATE_DEVTO_404 === 'true' && existingId) {
    throw createHttpError('Simulated missing dev.to article for testing.', 404);
  }

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
    throw createHttpError(`dev.to API request failed (${response.status} ${response.statusText}): ${body}`, response.status);
  }

  return (await response.json()) as { id: number; url?: string; updated_at?: string; published?: boolean };
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
  const shouldPublish = resolvePublishFlag();
  console.log(`Publishing mode: ${shouldPublish ? 'publish' : 'draft'}`);
  const postMap = loadPostMap(mapPath);

  for (const fileArg of fileArgs) {
    const absolutePath = path.resolve(fileArg);
    const relativePath = path.relative(process.cwd(), absolutePath);

    if (!fs.existsSync(absolutePath)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale dev.to mapping for ${relativePath} (file not found)`);
      }
      console.warn(`Skipped: ${fileArg} (file not found)`);
      continue;
    }
    const rawMarkdown = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = matter(rawMarkdown);
    const frontMatter = parsed.data as FrontMatter;

    if (!frontMatter.title) {
      console.warn(`Skipped: ${relativePath} (missing required front matter field: title)`);
      continue;
    }

    if (!wantsDevTo(frontMatter.platform)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale dev.to mapping for ${relativePath} (platform excludes dev.to)`);
      }
      console.log(`Skipped: ${relativePath} (platform excludes dev.to)`);
      continue;
    }

    const existingEntry = postMap[relativePath];
    
    // Validation logic based on publish mode
    if (shouldPublish) {
      // Publishing mode: ensure the article has been drafted at least once
      if (!existingEntry) {
        console.error(`Error: ${relativePath} - Cannot publish without creating a draft first. Run 'make draft' first.`);
        process.exitCode = 1;
        continue;
      }
    } else {
      // Draft mode: ensure not already published
      if (existingEntry?.published === true) {
        console.error(`Error: ${relativePath} - Cannot create/update draft for already published article. This would overwrite the published version.`);
        process.exitCode = 1;
        continue;
      }
    }

    const tags = ensureArrayOfStrings(frontMatter.tags);

    const articlePayload = {
      article: {
        title: frontMatter.title,
        published: shouldPublish,
        body_markdown: parsed.content.trim(),
        tags,
        canonical_url: frontMatter.canonical_url,
        cover_image: frontMatter.cover_image,
        series: frontMatter.series,
        organization_id: frontMatter.organization_id
      }
    };

    try {
      const apiResponse = await createOrUpdateArticle(apiKey, existingEntry?.id, articlePayload);
      postMap[relativePath] = {
        id: apiResponse.id,
        url: apiResponse.url,
        updatedAt: apiResponse.updated_at,
        published: shouldPublish
      };
      console.log(`${existingEntry ? 'Updated' : 'Created'} dev.to ${shouldPublish ? 'article' : 'draft'}: ${frontMatter.title}`);
    } catch (error) {
      const apiError = error as HttpError;
      if (apiError.status === 404 && existingEntry) {
        delete postMap[relativePath];
        console.warn(
          `Remote dev.to ${shouldPublish ? 'article' : 'draft'} for ${relativePath} is missing (404). Removed mapping so it will be recreated on the next run.`,
        );
      }
      const statusInfo = typeof apiError.status === 'number' ? ` [HTTP ${apiError.status}]` : '';
      console.error(`Failed to ${shouldPublish ? 'publish' : 'draft'} ${relativePath}${statusInfo}: ${apiError.message}`);
      process.exitCode = 1;
    }
  }

  savePostMap(mapPath, postMap);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
