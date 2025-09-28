import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { HttpError, PlatformValue, loadPostMap, savePostMap } from '../utils';

export type BaseFrontMatter = {
  title?: string;
  platform?: PlatformValue;
};

export type ValidateFrontMatterContext<FrontMatter, PostMapEntry> = {
  frontMatter: FrontMatter;
  relativePath: string;
  existingEntry?: PostMapEntry;
  shouldPublish: boolean;
};

export type ValidationResult<SanitizedData> = {
  isValid: boolean;
  sanitizedData?: SanitizedData;
  message?: string;
  level?: 'warn' | 'error';
  setExitCode?: boolean;
};

export type PreparePayloadContext<FrontMatter, PostMapEntry, SanitizedData> = {
  frontMatter: FrontMatter;
  content: string;
  shouldPublish: boolean;
  existingEntry?: PostMapEntry;
  sanitizedData?: SanitizedData;
};

export type PerformRequestContext<PostMapEntry, SanitizedData> = {
  payload: unknown;
  existingEntry?: PostMapEntry;
  shouldPublish: boolean;
  sanitizedData?: SanitizedData;
};

export type SynchronizePostMapEntryContext<FrontMatter, PostMapEntry, ApiResponse, SanitizedData> = {
  frontMatter: FrontMatter;
  existingEntry?: PostMapEntry;
  shouldPublish: boolean;
  response: ApiResponse;
  relativePath: string;
  sanitizedData?: SanitizedData;
};

export type SynchronizeResult<PostMapEntry> = {
  entry: PostMapEntry;
  message: string;
};

export type PublishingAdapter<
  FrontMatter extends BaseFrontMatter,
  PostMapEntry extends { published?: boolean },
  ApiResponse,
  SanitizedData = void,
> = {
  platformName: string;
  mapFilename: string;
  isPlatformEnabled: (frontMatter: FrontMatter) => boolean;
  validateFrontMatter: (
    context: ValidateFrontMatterContext<FrontMatter, PostMapEntry>,
  ) => ValidationResult<SanitizedData>;
  preparePayload: (
    context: PreparePayloadContext<FrontMatter, PostMapEntry, SanitizedData>,
  ) => unknown;
  performRequest: (
    context: PerformRequestContext<PostMapEntry, SanitizedData>,
  ) => Promise<ApiResponse>;
  synchronizePostMapEntry: (
    context: SynchronizePostMapEntryContext<FrontMatter, PostMapEntry, ApiResponse, SanitizedData>,
  ) => SynchronizeResult<PostMapEntry>;
};

export type RunPublishingWorkflowParams<
  FrontMatter extends BaseFrontMatter,
  PostMapEntry extends { published?: boolean },
  ApiResponse,
  SanitizedData = void,
> = {
  fileArgs: string[];
  shouldPublish: boolean;
  adapter: PublishingAdapter<FrontMatter, PostMapEntry, ApiResponse, SanitizedData>;
};

export const runPublishingWorkflow = async <
  FrontMatter extends BaseFrontMatter,
  PostMapEntry extends { published?: boolean },
  ApiResponse,
  SanitizedData = void,
>({ fileArgs, shouldPublish, adapter }: RunPublishingWorkflowParams<FrontMatter, PostMapEntry, ApiResponse, SanitizedData>): Promise<void> => {
  const mapPath = path.resolve(adapter.mapFilename);
  console.log(`${adapter.platformName} publishing mode: ${shouldPublish ? 'publish' : 'draft'}`);
  const postMap = loadPostMap<PostMapEntry>(mapPath);

  for (const fileArg of fileArgs) {
    const absolutePath = path.resolve(fileArg);
    const relativePath = path.relative(process.cwd(), absolutePath);

    if (!fs.existsSync(absolutePath)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(`Removed stale ${adapter.platformName} mapping for ${relativePath} (file not found)`);
      }
      console.warn(`Skipped: ${fileArg} (file not found)`);
      continue;
    }

    const rawMarkdown = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = matter(rawMarkdown);
    const frontMatter = parsed.data as FrontMatter;

    if (!frontMatter.title) {
      console.warn(`Skipped: ${relativePath} (missing required front matter field: title)`);
      continue;
    }

    if (!adapter.isPlatformEnabled(frontMatter)) {
      if (postMap[relativePath]) {
        delete postMap[relativePath];
        console.log(
          `Removed stale ${adapter.platformName} mapping for ${relativePath} (platform excludes ${adapter.platformName})`,
        );
      }
      console.log(`Skipped: ${relativePath} (platform excludes ${adapter.platformName})`);
      continue;
    }

    const existingEntry = postMap[relativePath];

    if (shouldPublish) {
      if (!existingEntry) {
        console.error(
          `Error: ${relativePath} - Cannot publish without creating a draft first. Run 'make draft' first.`,
        );
        process.exitCode = 1;
        continue;
      }
    } else if (existingEntry?.published === true) {
      console.error(
        `Error: ${relativePath} - Cannot create/update draft for already published article. This would overwrite the published version.`,
      );
      process.exitCode = 1;
      continue;
    }

    const validation = adapter.validateFrontMatter({
      frontMatter,
      relativePath,
      existingEntry,
      shouldPublish,
    });

    if (!validation.isValid) {
      const level = validation.level ?? 'warn';
      const message = validation.message ?? `Validation failed for ${relativePath}.`;
      if (level === 'error') {
        console.error(message);
      } else {
        console.warn(message);
      }
      if (validation.setExitCode) {
        process.exitCode = 1;
      }
      continue;
    }

    const content = parsed.content.trim();
    const payload = adapter.preparePayload({
      frontMatter,
      content,
      shouldPublish,
      existingEntry,
      sanitizedData: validation.sanitizedData,
    });

    try {
      const response = await adapter.performRequest({
        payload,
        existingEntry,
        shouldPublish,
        sanitizedData: validation.sanitizedData,
      });
      const { entry, message } = adapter.synchronizePostMapEntry({
        frontMatter,
        existingEntry,
        shouldPublish,
        response,
        relativePath,
        sanitizedData: validation.sanitizedData,
      });
      postMap[relativePath] = entry;
      console.log(message);
    } catch (error) {
      const apiError = error as HttpError;
      if (apiError.status === 404 && existingEntry) {
        delete postMap[relativePath];
        console.warn(
          `Remote ${adapter.platformName} ${shouldPublish ? 'article' : 'draft'} for ${relativePath} is missing (404). Removed mapping so it will be recreated on the next run.`,
        );
      }
      const statusInfo = typeof apiError.status === 'number' ? ` [HTTP ${apiError.status}]` : '';
      console.error(`Failed to ${shouldPublish ? 'publish' : 'draft'} ${relativePath}${statusInfo}: ${apiError.message}`);
      process.exitCode = 1;
    }
  }

  savePostMap(mapPath, postMap);
};
