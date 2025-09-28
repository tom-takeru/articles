import { runDevtoWorkflow } from './platform/devto';
import { runQiitaWorkflow } from './platform/qiita';

type Platform = 'devto' | 'qiita';
type Mode = 'draft' | 'publish';

type ParsedArguments = {
  platform: Platform;
  mode: Mode;
  files: string[];
};

const isPlatform = (value: string): value is Platform => value === 'devto' || value === 'qiita';
const isMode = (value: string): value is Mode => value === 'draft' || value === 'publish';

const parseArguments = (argv: string[]): ParsedArguments => {
  let platform: Platform | undefined;
  let mode: Mode | undefined;
  const files: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--platform' || arg.startsWith('--platform=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : argv[++index];
      if (!value) {
        throw new Error('Missing value for --platform. Expected "devto" or "qiita".');
      }
      if (!isPlatform(value)) {
        throw new Error(`Invalid platform "${value}". Expected "devto" or "qiita".`);
      }
      if (platform) {
        throw new Error('Platform specified multiple times. Provide --platform only once.');
      }
      platform = value;
      continue;
    }

    if (arg === '--mode' || arg.startsWith('--mode=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : argv[++index];
      if (!value) {
        throw new Error('Missing value for --mode. Expected "draft" or "publish".');
      }
      if (!isMode(value)) {
        throw new Error(`Invalid mode "${value}". Expected "draft" or "publish".`);
      }
      if (mode) {
        throw new Error('Mode specified multiple times. Provide --mode only once.');
      }
      mode = value;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    files.push(arg);
  }

  if (!platform) {
    throw new Error('Missing required --platform flag (devto|qiita).');
  }

  if (!mode) {
    throw new Error('Missing required --mode flag (draft|publish).');
  }

  return { platform, mode, files };
};

export const runPublisher = async (args: string[]): Promise<void> => {
  const { platform, mode, files } = parseArguments(args);
  const shouldPublish = mode === 'publish';

  if (platform === 'devto') {
    await runDevtoWorkflow(files, shouldPublish);
    return;
  }

  await runQiitaWorkflow(files, shouldPublish);
};

const runCli = async (): Promise<void> => {
  await runPublisher(process.argv.slice(2));
};

if (require.main === module) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
