export type PlatformValue = string | string[] | undefined;

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
