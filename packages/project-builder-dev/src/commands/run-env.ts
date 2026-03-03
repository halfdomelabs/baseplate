import type { Command } from 'commander';

import fs from 'node:fs/promises';
import path from 'node:path';

import { createEnvironmentHelpers } from '#src/e2e-runner/environment.js';
import { waitForSignal } from '#src/e2e-runner/utils/wait-for-signal.js';
import { loadDevConfig } from '#src/utils/dev-config.js';

import { discoverTests } from '../e2e-runner/discover-tests.js';

const DEFAULT_TEST_DEFS_DIR = path.join('src', 'tests');

/**
 * Adds the run-env command to the program.
 */
export function addRunEnvCommand(program: Command): void {
  program
    .command('run-env <test-name>')
    .description('Start a test project environment and wait (for development)')
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(async (testName: string, opts: { testDefsDir: string }) => {
      const config = await loadDevConfig();
      if (!config.testProjectsDirectory) {
        throw new Error(
          'No test directory configured. Set "testProjectsDirectory" in baseplate.config.json.',
        );
      }

      const testProjectDir = path.join(config.testProjectsDirectory, testName);
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
    });
}
