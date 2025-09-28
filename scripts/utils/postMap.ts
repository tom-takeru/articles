import fs from 'fs';

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
