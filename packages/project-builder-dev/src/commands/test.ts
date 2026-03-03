import type { Command } from 'commander';

import path from 'node:path';

import { runTests } from '#src/e2e-runner/runner.js';
import { loadDevConfig } from '#src/utils/dev-config.js';

const DEFAULT_TEST_DEFS_DIR = path.join('src', 'tests');

/**
 * Adds the test execution commands to the program.
 */
export function addTestCommand(program: Command): void {
  const testCommand = program
    .command('test')
    .description('Run test suites for Baseplate project generation');

  // test gen [filter]
  testCommand
    .command('gen [filter]')
    .description(
      'Run generated code test suite (generate, setup environment, run tests)',
    )
    .option('--test-projects-dir <dir>', 'Directory containing test projects')
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(
      async (
        filter: string | undefined,
        opts: { testProjectsDir?: string; testDefsDir: string },
      ) => {
        const testDefinitionsDir = path.resolve(opts.testDefsDir);

        let testProjectsDir: string;
        if (opts.testProjectsDir) {
          testProjectsDir = path.resolve(opts.testProjectsDir);
        } else {
          const config = await loadDevConfig();
          if (!config.testProjectsDirectory) {
            throw new Error(
              'No test directory configured. Set "testProjectsDirectory" in baseplate.config.json or use --test-projects-dir.',
            );
          }
          testProjectsDir = config.testProjectsDirectory;
        }

        await runTests({
          testDefinitionsDir,
          testProjectsDir,
          filter,
        });
      },
    );
}
