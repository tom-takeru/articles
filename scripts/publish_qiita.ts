import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

type FrontMatter = {
  title?: string;
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
  published?: boolean;
};

type PostMap = Record<string, PostMapEntry>;

const API_BASE = 'https://qiita.com/api/v2';
const MAP_FILE = '.posts-map.qiita.json';

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
): Promise<{ id: string; url?: string; updated_at?: string; private?: boolean }> => {
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

  return (await response.json()) as { id: string; url?: string; updated_at?: string; private?: boolean };
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
  const shouldPublish = resolvePublishFlag();
  console.log(`Publishing mode: ${shouldPublish ? 'publish' : 'draft'}`);
  const postMap = loadPostMap(mapPath);

  for (const fileArg of fileArgs) {
    const absolutePath = path.resolve(fileArg);
    const relativePath = path.relative(process.cwd(), absolutePath);

    if (!fs.existsSync(absolutePath)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale Qiita mapping for ${relativePath} (file not found)`);
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

    if (!wantsQiita(frontMatter.platform)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale Qiita mapping for ${relativePath} (platform excludes Qiita)`);
      }
      console.log(`Skipped: ${relativePath} (platform excludes Qiita)`);
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
    if (!tags || tags.length < 1 || tags.length > 5) {
      console.error(
        `Error: ${relativePath} - Qiita requires between 1 and 5 tags; found ${tags ? tags.length : 0}. Update the front matter and try again.`,
      );
      process.exitCode = 1;
      continue;
    }

    const itemPayload = {
      title: frontMatter.title,
      body: parsed.content.trim(),
      tags: toQiitaTags(tags),
      private: !shouldPublish,
      coediting: false,
      group_url_name: frontMatter.qiita_org,
      tweet: false
    };

    try {
      const apiResponse = await createOrUpdateQiitaItem(token, existingEntry?.id, itemPayload);
      postMap[relativePath] = {
        id: apiResponse.id,
        url: apiResponse.url,
        updatedAt: apiResponse.updated_at,
        published: shouldPublish
      };
      console.log(`${existingEntry ? 'Updated' : 'Created'} Qiita ${shouldPublish ? 'article' : 'draft'}: ${frontMatter.title}`);
    } catch (error) {
      console.error(`Failed to ${shouldPublish ? 'publish' : 'draft'} ${relativePath}: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  }

  savePostMap(mapPath, postMap);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
