import { runDevtoWorkflow } from './devto';

const runCli = async (): Promise<void> => {
  const fileArgs = process.argv.slice(2);
  await runDevtoWorkflow(fileArgs, true);
};

if (require.main === module) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
