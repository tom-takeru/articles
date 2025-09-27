import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

import {
  HttpError,
  createHttpError,
  ensureArrayOfStrings,
  loadPostMap,
  savePostMap,
  wantsPlatform
} from './utils';

type DevtoFrontMatter = {
  title?: string;
  tags?: string[] | string;
  canonical_url?: string;
  cover_image?: string;
  series?: string;
  organization_id?: number;
  platform?: string | string[];
};

type DevtoPostMapEntry = {
  id: number;
  url?: string;
  updatedAt?: string;
  published?: boolean;
};

const DEVTO_API_BASE = 'https://dev.to/api';
const DEVTO_POST_MAP = '.posts-map.devto.json';

const wantsDevto = (platform: DevtoFrontMatter['platform']): boolean => wantsPlatform(platform, 'devto');

const createOrUpdateDevtoArticle = async (
  token: string,
  existingId: number | undefined,
  payload: unknown,
): Promise<{ id: number; url?: string; updated_at?: string; published?: boolean }> => {
  const url = existingId ? `${DEVTO_API_BASE}/articles/${existingId}` : `${DEVTO_API_BASE}/articles`;
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

export const runDevtoWorkflow = async (
  fileArgs: string[],
  shouldPublish: boolean,
): Promise<void> => {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    throw new Error('DEVTO_API_KEY is not set.');
  }

  if (fileArgs.length === 0) {
    console.log('No English content files provided. Nothing to do for dev.to.');
    return;
  }

  const mapPath = path.resolve(DEVTO_POST_MAP);
  console.log(`dev.to publishing mode: ${shouldPublish ? 'publish' : 'draft'}`);
  const postMap = loadPostMap<DevtoPostMapEntry>(mapPath);

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
    const frontMatter = parsed.data as DevtoFrontMatter;

    if (!frontMatter.title) {
      console.warn(`Skipped: ${relativePath} (missing required front matter field: title)`);
      continue;
    }

    if (!wantsDevto(frontMatter.platform)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale dev.to mapping for ${relativePath} (platform excludes dev.to)`);
      }
      console.log(`Skipped: ${relativePath} (platform excludes dev.to)`);
      continue;
    }

    const existingEntry = postMap[relativePath];

    if (shouldPublish) {
      if (!existingEntry) {
        console.error(`Error: ${relativePath} - Cannot publish without creating a draft first. Run 'make draft' first.`);
        process.exitCode = 1;
        continue;
      }
    } else if (existingEntry?.published === true) {
      console.error(
        `Error: ${relativePath} - Cannot create/update draft for already published article. This would overwrite the published version.`,
      );
      process.exitCode = 1;
      continue;
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
      const apiResponse = await createOrUpdateDevtoArticle(apiKey, existingEntry?.id, articlePayload);
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
