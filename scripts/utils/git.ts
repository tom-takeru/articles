import { execSync } from 'child_process';

import { isContentMarkdown } from './content';

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

export const collectContentFilesFromGitStatus = (): Set<string> => {
  const result = new Set<string>();

  const statusOutput = execSync('git status --porcelain', {
    encoding: 'utf-8',
    cwd: process.cwd(),
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
