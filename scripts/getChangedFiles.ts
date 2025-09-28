import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Get markdown files that have changed since the last commit
 * Returns separate arrays for English and Japanese content
 */
const getChangedMarkdownFiles = (): { en: string[]; ja: string[] } => {
  try {
    // Get files changed in the working directory (staged + unstaged)
    const diffOutput = execSync('git diff --name-only HEAD', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    // Capture untracked files (e.g., new drafts not yet staged)
    const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    const changedFilesSet = new Set<string>();

    if (diffOutput) {
      diffOutput
        .split('\n')
        .filter(Boolean)
        .forEach(file => changedFilesSet.add(file));
    }

    if (untrackedOutput) {
      untrackedOutput
        .split('\n')
        .filter(Boolean)
        .forEach(file => changedFilesSet.add(file));
    }

    const markdownFiles = Array.from(changedFilesSet).filter(file =>
      file.endsWith('.md') &&
      (file.startsWith('content/en/') || file.startsWith('content/ja/')) &&
      fs.existsSync(path.resolve(file))
    );

    const enFiles = markdownFiles.filter(file => file.startsWith('content/en/'));
    const jaFiles = markdownFiles.filter(file => file.startsWith('content/ja/'));

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