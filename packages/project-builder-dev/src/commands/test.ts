import type { Command } from 'commander';

import path from 'node:path';

import { runTests } from '#src/e2e-runner/runner.js';

const DEFAULT_TEST_PROJECTS_DIR = 'test-projects';
const DEFAULT_TEST_DEFS_DIR = path.join('src', 'tests');
const DEFAULT_OUTPUT_DIR = 'generated-tests';

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
    .option(
      '--test-projects-dir <dir>',
      'Directory containing test projects',
      DEFAULT_TEST_PROJECTS_DIR,
    )
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(
      async (
        filter: string | undefined,
        opts: { testProjectsDir: string; testDefsDir: string },
      ) => {
        const testDefinitionsDir = path.resolve(opts.testDefsDir);
        const testProjectsDir = path.resolve(opts.testProjectsDir);
        const outputDir = path.resolve(DEFAULT_OUTPUT_DIR);

        await runTests({
          testDefinitionsDir,
          testProjectsDir,
          outputDir,
          filter,
        });
      },
    );
}
