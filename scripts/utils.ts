import fs from 'fs';

export type HttpError = Error & { status?: number };

export type PlatformValue = string | string[] | undefined;

export const createHttpError = (message: string, status?: number): HttpError => {
  const error = new Error(message) as HttpError;
  if (typeof status === 'number') {
    error.status = status;
  }
  return error;
};

export const wantsPlatform = (platform: PlatformValue, target: string): boolean => {
  if (!platform) return true;
  const normalizedTarget = target.toLowerCase();
  if (typeof platform === 'string') {
    const normalized = platform.toLowerCase();
    if (normalized === 'auto') return true;
    return normalized
      .split(',')
      .map(token => token.trim())
      .filter(Boolean)
      .includes(normalizedTarget);
  }
  return platform.map(token => token.toLowerCase()).includes(normalizedTarget);
};

export const ensureArrayOfStrings = (
  value: string[] | string | undefined,
): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(item => String(item));
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
};

export const loadPostMap = <TEntry>(mapPath: string): Record<string, TEntry> => {
  try {
    const raw = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(raw) as Record<string, TEntry>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

export const savePostMap = <TEntry>(mapPath: string, data: Record<string, TEntry>): void => {
  fs.writeFileSync(mapPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
};
