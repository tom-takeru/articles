import {
  collectContentFilesFromGitStatus,
  findMissingPostMapEntries,
  isContentMarkdown,
  splitContentFilesByLocale,
} from './utils';

/**
 * Get markdown files that have changed since the last commit
 * Returns separate arrays for English and Japanese content
 */
const getChangedMarkdownFiles = (): { en: string[]; ja: string[] } => {
  try {
    // Get files changed in the working directory (staged + unstaged)
    const changedFilesSet = collectContentFilesFromGitStatus();
    const missingFromMaps = findMissingPostMapEntries(isContentMarkdown);
    const missingByRelativePath = new Map<string, Set<string>>();

    for (const { relativePath, mapFile } of missingFromMaps) {
      changedFilesSet.add(relativePath);

      if (!missingByRelativePath.has(relativePath)) {
        missingByRelativePath.set(relativePath, new Set());
      }
      missingByRelativePath.get(relativePath)?.add(mapFile);
    }

    const { en, ja } = splitContentFilesByLocale(changedFilesSet);

    if (missingByRelativePath.size > 0) {
      console.log(
        'Detected published mapping entries without source files (including drafts deleted before their first commit). They will be cleaned up:',
      );
      for (const [relativePath, mapFiles] of missingByRelativePath.entries()) {
        const mapList = Array.from(mapFiles).join(', ');
        console.log(`  ${relativePath} -> ${mapList}`);
      }
    }

    return { en, ja };
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
