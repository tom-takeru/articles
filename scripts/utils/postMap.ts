import fs from 'fs';
import path from 'path';

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

export const POST_MAP_FILES = ['.posts-map.devto.json', '.posts-map.qiita.json'];

export type MissingPostMapEntry = {
  relativePath: string;
  mapFile: string;
};

export const findMissingPostMapEntries = (
  isContentPath: (relativePath: string) => boolean,
  postMapFiles: string[] = POST_MAP_FILES,
): MissingPostMapEntry[] => {
  const missingEntries: MissingPostMapEntry[] = [];

  for (const mapFile of postMapFiles) {
    const mapPath = path.resolve(mapFile);

    let entries: Record<string, unknown>;
    try {
      entries = loadPostMap<unknown>(mapPath);
    } catch (error) {
      console.warn(`Warning: Unable to parse ${mapFile}: ${(error as Error).message}`);
      continue;
    }

    for (const relativePath of Object.keys(entries)) {
      if (!isContentPath(relativePath)) {
        continue;
      }

      const absolutePath = path.resolve(relativePath);
      if (!fs.existsSync(absolutePath)) {
        missingEntries.push({
          relativePath,
          mapFile,
        });
      }
    }
  }

  return missingEntries;
};
