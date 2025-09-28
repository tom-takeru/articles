export const CONTENT_DIRECTORIES = ['content/en/', 'content/ja/'];

export const isContentMarkdown = (file: string): boolean =>
  file.endsWith('.md') && CONTENT_DIRECTORIES.some(dir => file.startsWith(dir));

export const splitContentFilesByLocale = (
  files: Iterable<string>,
): { en: string[]; ja: string[] } => {
  const en: string[] = [];
  const ja: string[] = [];

  for (const file of files) {
    if (!isContentMarkdown(file)) {
      continue;
    }

    if (file.startsWith('content/en/')) {
      en.push(file);
    } else if (file.startsWith('content/ja/')) {
      ja.push(file);
    }
  }

  return { en, ja };
};
