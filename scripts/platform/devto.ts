import fetch from 'node-fetch';

import {
  createHttpError,
  ensureArrayOfStrings,
  wantsPlatform,
  type DevtoFrontMatter,
} from '../utils';
import { PublishingAdapter, runPublishingWorkflow } from '../publishingWorkflowRunner';

type DevtoPostMapEntry = {
  id: number;
  url?: string;
  updatedAt?: string;
  publishedAt?: string;
  published?: boolean;
};

const DEVTO_API_BASE = 'https://dev.to/api';
const DEVTO_POST_MAP = '.posts-map.devto.json';

const wantsDevto = (platform: DevtoFrontMatter['platform']): boolean => wantsPlatform(platform, 'devto');

type DevtoApiArticle = {
  id: number;
  url?: string;
  updated_at?: string;
  edited_at?: string;
  published_at?: string;
  published?: boolean;
};

const createOrUpdateDevtoArticle = async (
  token: string,
  existingId: number | undefined,
  payload: unknown,
): Promise<DevtoApiArticle> => {
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

  return (await response.json()) as DevtoApiArticle;
};

const createDevtoAdapter = (
  apiKey: string,
): PublishingAdapter<DevtoFrontMatter, DevtoPostMapEntry, DevtoApiArticle> => ({
  platformName: 'dev.to',
  mapFilename: DEVTO_POST_MAP,
  isPlatformEnabled: frontMatter => wantsDevto(frontMatter.platform),
  validateFrontMatter: () => ({ isValid: true }),
  preparePayload: ({ frontMatter, content, shouldPublish }) => {
    const tags = ensureArrayOfStrings(frontMatter.tags);
    return {
      article: {
        title: frontMatter.title,
        published: shouldPublish,
        body_markdown: content,
        tags,
        canonical_url: frontMatter.canonical_url,
        cover_image: frontMatter.cover_image,
        series: frontMatter.series,
        organization_id: frontMatter.organization_id
      }
    };
  },
  performRequest: ({ payload, existingEntry }) =>
    createOrUpdateDevtoArticle(apiKey, existingEntry?.id, payload),
  synchronizePostMapEntry: ({
    frontMatter,
    existingEntry,
    response,
    shouldPublish,
  }) => {
    const updatedAt =
      response.edited_at ?? response.updated_at ?? response.published_at ?? new Date().toISOString();
    return {
      entry: {
        id: response.id,
        url: response.url,
        updatedAt,
        publishedAt: response.published_at,
        published: shouldPublish
      },
      message: `${existingEntry ? 'Updated' : 'Created'} dev.to ${shouldPublish ? 'article' : 'draft'}: ${frontMatter.title}`
    };
  }
});

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

  const adapter = createDevtoAdapter(apiKey);
  await runPublishingWorkflow({ fileArgs, shouldPublish, adapter });
};
