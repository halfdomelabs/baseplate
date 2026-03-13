import type { Command } from 'commander';

import path from 'node:path';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

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
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(
      async (filter: string | undefined, opts: { testDefsDir: string }) => {
        const testDefinitionsDir = path.resolve(opts.testDefsDir);
        const context = await createServiceActionContext();
        const testProjects = context.projects.filter((p) => p.type === 'test');

        if (testProjects.length === 0) {
          throw new Error(
            'No test projects found. Set "testProjectsDirectory" in baseplate.config.json.',
          );
        }

        const { runTests } = await import('#src/e2e-runner/runner.js');

        await runTests({
          testDefinitionsDir,
          testProjects,
          context,
          filter,
        });
      },
    );
}
