import fs from 'fs';
import matter from 'gray-matter';

import type { PlatformValue } from './platform';

export const ensureArrayOfStrings = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;

  const list = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map(item => item.trim());

  const normalized = list
    .map(item => String(item).trim())
    .filter(item => item.length > 0);

  return normalized.length > 0 ? normalized : undefined;
};

export type ContentFrontMatter<T extends Record<string, unknown> = Record<string, unknown>> = {
  title: string;
  tags?: string[];
  platform?: PlatformValue;
} & T;

export type ParsedContent<T extends Record<string, unknown> = Record<string, unknown>> = {
  frontMatter: ContentFrontMatter<T>;
  body: string;
};

export type ParseOptions = {
  filePath?: string;
};

const normalizePlatform = (value: unknown): PlatformValue => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const normalized = value
      .map(item => String(item).trim())
      .filter(item => item.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
};

const normalizeContent = (body: string): string => body.replace(/\r\n/g, '\n').trim();

export const parseFrontMatter = <T extends Record<string, unknown> = Record<string, unknown>>(
  raw: string,
  options: ParseOptions = {},
): ParsedContent<T> => {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const rawTitle = data.title;
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';

  if (!title) {
    const prefix = options.filePath ? `${options.filePath}: ` : '';
    throw new Error(`${prefix}missing required front matter field: title`);
  }

  const { tags: rawTags, platform: rawPlatform, ...rest } = data;

  const frontMatter: ContentFrontMatter<T> = {
    ...(rest as T),
    title,
    tags: ensureArrayOfStrings(rawTags),
    platform: normalizePlatform(rawPlatform),
  };

  return {
    frontMatter,
    body: normalizeContent(parsed.content),
  };
};

export const readContentFile = <T extends Record<string, unknown> = Record<string, unknown>>(
  filePath: string,
): ParsedContent<T> => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseFrontMatter<T>(raw, { filePath });
};

export type DevtoFrontMatterFields = {
  canonical_url?: string;
  cover_image?: string;
  series?: string;
  organization_id?: number;
};

export type DevtoFrontMatter = ContentFrontMatter<DevtoFrontMatterFields>;

export type QiitaFrontMatterFields = {
  canonical_url?: string;
  cover_image?: string;
  series?: string;
  qiita_org?: string;
};

export type QiitaFrontMatter = ContentFrontMatter<QiitaFrontMatterFields>;
