import { runQiitaWorkflow } from './qiita';

const runCli = async (): Promise<void> => {
  const fileArgs = process.argv.slice(2);
  await runQiitaWorkflow(fileArgs, false);
};

if (require.main === module) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
