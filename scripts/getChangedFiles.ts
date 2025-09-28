import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONTENT_DIRECTORIES = ['content/en/', 'content/ja/'];
const POST_MAP_FILES = ['.posts-map.devto.json', '.posts-map.qiita.json'];

const isContentMarkdown = (file: string): boolean =>
  file.endsWith('.md') && CONTENT_DIRECTORIES.some(dir => file.startsWith(dir));

const addIfContentMarkdown = (files: Set<string>, candidate: string | undefined): void => {
  if (!candidate) {
    return;
  }

  const normalized = candidate.trim();
  if (!normalized) {
    return;
  }

  if (isContentMarkdown(normalized)) {
    files.add(normalized);
  }
};

const collectFilesFromGitStatus = (): Set<string> => {
  const result = new Set<string>();

  const statusOutput = execSync('git status --porcelain', {
    encoding: 'utf-8',
    cwd: process.cwd()
  }).trim();

  if (!statusOutput) {
    return result;
  }

  statusOutput
    .split('\n')
    .filter(Boolean)
    .forEach(line => {
      const status = line.slice(0, 2);
      const filePart = line.slice(3);
      if (!filePart) {
        return;
      }

      const trimmedStatus = status.trim();
      if (trimmedStatus.startsWith('R')) {
        const [from, to] = filePart.split(' -> ');
        addIfContentMarkdown(result, from);
        addIfContentMarkdown(result, to);
        return;
      }

      addIfContentMarkdown(result, filePart);
    });

  return result;
};

type MissingPostMapEntry = {
  relativePath: string;
  mapFile: string;
};

const collectMissingFilesFromPostMaps = (): MissingPostMapEntry[] => {
  const missingEntries: MissingPostMapEntry[] = [];

  for (const mapFile of POST_MAP_FILES) {
    const mapPath = path.resolve(mapFile);
    let raw: string;

    try {
      raw = fs.readFileSync(mapPath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    let entries: Record<string, unknown>;
    try {
      entries = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      console.warn(`Warning: Unable to parse ${mapFile}: ${(error as Error).message}`);
      continue;
    }

    for (const relativePath of Object.keys(entries)) {
      if (!isContentMarkdown(relativePath)) {
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

/**
 * Get markdown files that have changed since the last commit
 * Returns separate arrays for English and Japanese content
 */
const getChangedMarkdownFiles = (): { en: string[]; ja: string[] } => {
  try {
    // Get files changed in the working directory (staged + unstaged)
    const changedFilesSet = collectFilesFromGitStatus();
    const missingFromMaps = collectMissingFilesFromPostMaps();
    const missingByRelativePath = new Map<string, Set<string>>();

    for (const { relativePath, mapFile } of missingFromMaps) {
      changedFilesSet.add(relativePath);

      if (!missingByRelativePath.has(relativePath)) {
        missingByRelativePath.set(relativePath, new Set());
      }
      missingByRelativePath.get(relativePath)?.add(mapFile);
    }

    const markdownFiles = Array.from(changedFilesSet).filter(isContentMarkdown);

    const enFiles = markdownFiles.filter(file => file.startsWith('content/en/'));
    const jaFiles = markdownFiles.filter(file => file.startsWith('content/ja/'));

    if (missingByRelativePath.size > 0) {
      console.log(
        'Detected published mapping entries without source files (including drafts deleted before their first commit). They will be cleaned up:',
      );
      for (const [relativePath, mapFiles] of missingByRelativePath.entries()) {
        const mapList = Array.from(mapFiles).join(', ');
        console.log(`  ${relativePath} -> ${mapList}`);
      }
    }

    return { en: enFiles, ja: jaFiles };
  } catch (error) {
    console.error('Error detecting changed files:', (error as Error).message);
    process.exitCode = 1;
    return { en: [], ja: [] };
  }
};

const main = (): void => {
  const changedFiles = getChangedMarkdownFiles();
  
  if (changedFiles.en.length === 0 && changedFiles.ja.length === 0) {
    console.log('No changed markdown files found.');
    return;
  }

  if (changedFiles.en.length > 0) {
    console.log('Changed English files:');
    changedFiles.en.forEach(file => console.log(`  ${file}`));
  }

  if (changedFiles.ja.length > 0) {
    console.log('Changed Japanese files:');
    changedFiles.ja.forEach(file => console.log(`  ${file}`));
  }

  // Output files as space-separated lists for use in Makefile
  console.log(`EN_FILES=${changedFiles.en.join(' ')}`);
  console.log(`JA_FILES=${changedFiles.ja.join(' ')}`);
};

// Allow this script to be used as a module or run directly
if (require.main === module) {
  main();
}

export { getChangedMarkdownFiles };