import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  testProjectInitAction,
} from '@baseplate-dev/project-builder-server/actions';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createEnvironmentHelpers } from '#src/e2e-runner/environment.js';
import { waitForSignal } from '#src/e2e-runner/utils/wait-for-signal.js';
import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { loadDevConfig } from '#src/utils/dev-config.js';

import { discoverTests } from '../e2e-runner/discover-tests.js';

const DEFAULT_TEST_DEFS_DIR = path.join('src', 'tests');

async function resolveTestProjectDir(
  testName: string,
  testProjectsDir?: string,
): Promise<string> {
  if (testProjectsDir) {
    return path.resolve(testProjectsDir, testName);
  }
  const config = await loadDevConfig();
  if (config.testDirectory) {
    return path.join(config.testDirectory, testName);
  }
  throw new Error(
    'No test directory configured. Set "testDirectory" in baseplate.config.json or use --test-projects-dir.',
  );
}

/**
 * Adds the test-project management commands to the program.
 */
export function addTestProjectCommand(program: Command): void {
  const testProjectCommand = program
    .command('test-project')
    .description('Manage test projects for Baseplate project generation');

  // test-project init <test-name>
  testProjectCommand
    .command('init <test-name>')
    .description('Create a new test project with an initial project definition')
    .option('--test-projects-dir <dir>', 'Directory containing test projects')
    .action(async (testName: string, opts: { testProjectsDir?: string }) => {
      const testProjectDir = await resolveTestProjectDir(
        testName,
        opts.testProjectsDir,
      );

      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        testProjectInitAction,
        { testProjectDirectory: testProjectDir, testName },
        context,
      );
    });

  // test-project run-env <test-name>
  testProjectCommand
    .command('run-env <test-name>')
    .description('Start a test project environment and wait (for development)')
    .option('--test-projects-dir <dir>', 'Directory containing test projects')
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(
      async (
        testName: string,
        opts: { testProjectsDir?: string; testDefsDir: string },
      ) => {
        const testProjectDir = await resolveTestProjectDir(
          testName,
          opts.testProjectsDir,
        );
        const projectDirectoryPath = path.join(testProjectDir, '.output');
        const testDefinitionsDir = path.resolve(opts.testDefsDir);

        // Check if generated project exists
        try {
          await fs.access(path.join(projectDirectoryPath, 'package.json'));
        } catch {
          throw new Error(
            `Project directory ${projectDirectoryPath} does not contain a package.json file. ` +
              `Run 'baseplate-dev sync test:${testName} --overwrite' first.`,
          );
        }

        // Discover the matching test definition
        const tests = await discoverTests(testDefinitionsDir);
        const test = tests.find((t) => t.content.projectDirectory === testName);

        if (!test) {
          throw new Error(`No test definition found for project ${testName}`);
        }

        console.info(`Starting project environment for ${testName}...`);

        const environmentHelper = createEnvironmentHelpers({
          projectDirectoryPath,
          streamCommandOutput: true,
        });

        try {
          await test.content.setupEnvironment(
            { projectDirectoryPath, streamCommandOutput: true },
            environmentHelper,
          );
          await waitForSignal();
        } finally {
          await environmentHelper.shutdown(false);
        }
      },
    );
}
