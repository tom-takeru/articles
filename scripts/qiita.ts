import fetch from 'node-fetch';

import { createHttpError } from './utils/http';
import { ensureArrayOfStrings, type QiitaFrontMatter } from './utils/frontMatter';
import { wantsPlatform } from './utils/platform';
import { PublishingAdapter, runPublishingWorkflow, ValidationResult } from './publishingWorkflowRunner';

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

  type QiitaValidationData = { tags: string[] };

  const adapter: PublishingAdapter<
    QiitaFrontMatter,
    QiitaPostMapEntry,
    { id: string; url?: string; updated_at?: string; private?: boolean },
    QiitaValidationData
  > = {
    platformName: 'Qiita',
    mapFilename: QIITA_POST_MAP,
    isPlatformEnabled: frontMatter => wantsQiita(frontMatter.platform),
    validateFrontMatter: ({ frontMatter, relativePath }): ValidationResult<QiitaValidationData> => {
      const tags = ensureArrayOfStrings(frontMatter.tags);
      if (!tags || tags.length < 1 || tags.length > 5) {
        return {
          isValid: false,
          message: `Error: ${relativePath} - Qiita requires between 1 and 5 tags; found ${tags ? tags.length : 0}. Update the front matter and try again.`,
          level: 'error',
          setExitCode: true
        };
      }
      return { isValid: true, sanitizedData: { tags } };
    },
    preparePayload: ({ frontMatter, content, shouldPublish, sanitizedData }) => {
      const organizationUrlName = frontMatter.qiita_org?.trim();

      return {
        title: frontMatter.title,
        body: content,
        tags: toQiitaTags(sanitizedData?.tags),
        private: !shouldPublish,
        coediting: false,
        ...(organizationUrlName ? { group_url_name: organizationUrlName } : {}),
        tweet: false
      };
    },
    performRequest: ({ payload, existingEntry }) => createOrUpdateQiitaItem(token, existingEntry?.id, payload),
    synchronizePostMapEntry: ({ frontMatter, existingEntry, response, shouldPublish }) => ({
      entry: {
        id: response.id,
        url: response.url,
        updatedAt: response.updated_at,
        published: shouldPublish
      },
      message: `${existingEntry ? 'Updated' : 'Created'} Qiita ${shouldPublish ? 'article' : 'draft'}: ${frontMatter.title}`
    })
  };

  await runPublishingWorkflow({ fileArgs, shouldPublish, adapter });
};
