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

type QiitaFrontMatter = {
  title?: string;
  tags?: string[] | string;
  canonical_url?: string;
  cover_image?: string;
  series?: string;
  platform?: string | string[];
  qiita_org?: string;
};

type QiitaPostMapEntry = {
  id: string;
  url?: string;
  updatedAt?: string;
  published?: boolean;
};

const QIITA_API_BASE = 'https://qiita.com/api/v2';
const QIITA_POST_MAP = '.posts-map.qiita.json';

const wantsQiita = (platform: QiitaFrontMatter['platform']): boolean => wantsPlatform(platform, 'qiita');

const toQiitaTags = (tags?: string[]): { name: string; versions: string[] }[] => {
  if (!tags) return [];
  return tags.map(tag => ({ name: tag, versions: [] }));
};

const createOrUpdateQiitaItem = async (
  token: string,
  existingId: string | undefined,
  payload: unknown,
): Promise<{ id: string; url?: string; updated_at?: string; private?: boolean }> => {
  const pathSegment = existingId ? `/items/${existingId}` : '/items';
  const method = existingId ? 'PATCH' : 'POST';

  if (process.env.SIMULATE_QIITA_404 === 'true' && existingId) {
    throw createHttpError('Simulated missing Qiita draft for testing.', 404);
  }

  const response = await fetch(`${QIITA_API_BASE}${pathSegment}`, {
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
    throw createHttpError(`Qiita API request failed (${response.status} ${response.statusText}): ${body}`, response.status);
  }

  return (await response.json()) as { id: string; url?: string; updated_at?: string; private?: boolean };
};

export const runQiitaWorkflow = async (
  fileArgs: string[],
  shouldPublish: boolean,
): Promise<void> => {
  const token = process.env.QIITA_TOKEN;
  if (!token) {
    throw new Error('QIITA_TOKEN is not set.');
  }

  if (fileArgs.length === 0) {
    console.log('No Japanese content files provided. Nothing to do for Qiita.');
    return;
  }

  const mapPath = path.resolve(QIITA_POST_MAP);
  console.log(`Qiita publishing mode: ${shouldPublish ? 'publish' : 'draft'}`);
  const postMap = loadPostMap<QiitaPostMapEntry>(mapPath);

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
    const frontMatter = parsed.data as QiitaFrontMatter;

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
      const apiError = error as HttpError;
      if (apiError.status === 404 && existingEntry) {
        delete postMap[relativePath];
        console.warn(
          `Remote Qiita ${shouldPublish ? 'article' : 'draft'} for ${relativePath} is missing (404). Removed mapping so it will be recreated on the next run.`,
        );
      }
      const statusInfo = typeof apiError.status === 'number' ? ` [HTTP ${apiError.status}]` : '';
      console.error(`Failed to ${shouldPublish ? 'publish' : 'draft'} ${relativePath}${statusInfo}: ${apiError.message}`);
      process.exitCode = 1;
    }
  }

  savePostMap(mapPath, postMap);
};

const runCli = async (): Promise<void> => {
  const fileArgs = process.argv.slice(2);
  await runQiitaWorkflow(fileArgs, true);
};

if (require.main === module) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
