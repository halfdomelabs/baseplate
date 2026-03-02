import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  testProjectGenerateAction,
  testProjectInitAction,
  testProjectSaveAction,
} from '@baseplate-dev/project-builder-server/actions';
import { dirExists } from '@baseplate-dev/utils/node';
import { confirm } from '@inquirer/prompts';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createEnvironmentHelpers } from '#src/e2e-runner/environment.js';
import {
  assertNotStale,
  writeGenerationManifest,
} from '#src/e2e-runner/generation-manifest.js';
import { waitForSignal } from '#src/e2e-runner/utils/wait-for-signal.js';
import { logger } from '#src/services/logger.js';
import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

import { discoverTests } from '../e2e-runner/discover-tests.js';

const DEFAULT_TEST_PROJECTS_DIR = 'test-projects';
const DEFAULT_TEST_DEFS_DIR = path.join('src', 'tests');
const DEFAULT_OUTPUT_DIR = 'generated-tests';

function resolveTestProjectDir(
  testName: string,
  testProjectsDir?: string,
): string {
  const base = testProjectsDir ?? DEFAULT_TEST_PROJECTS_DIR;
  return path.resolve(base, testName);
}

function resolveOutputDir(testName: string, outputDir?: string): string {
  const base = outputDir ?? DEFAULT_OUTPUT_DIR;
  return path.resolve(base, testName);
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
    .option(
      '--test-projects-dir <dir>',
      'Directory containing test projects',
      DEFAULT_TEST_PROJECTS_DIR,
    )
    .action(async (testName: string, opts: { testProjectsDir: string }) => {
      const testProjectDir = resolveTestProjectDir(
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

  // test-project generate <test-name>
  testProjectCommand
    .command('generate <test-name>')
    .description(
      'Generate a test project into generated-tests/<test-name>/ and apply snapshots',
    )
    .option(
      '--test-projects-dir <dir>',
      'Directory containing test projects',
      DEFAULT_TEST_PROJECTS_DIR,
    )
    .option('--overwrite', 'Overwrite existing output directory', false)
    .option(
      '--force',
      'Force overwrite even if files have been modified',
      false,
    )
    .action(
      async (
        testName: string,
        opts: { testProjectsDir: string; overwrite: boolean; force: boolean },
      ) => {
        const testProjectDir = resolveTestProjectDir(
          testName,
          opts.testProjectsDir,
        );
        const outputDir = resolveOutputDir(testName);

        if ((await dirExists(outputDir)) && !opts.force) {
          await assertNotStale(outputDir);
        }

        logger.info(`Generating test project '${testName}'...`);
        const context = await createServiceActionContext();
        await invokeServiceActionAsCli(
          testProjectGenerateAction,
          {
            testProjectDirectory: testProjectDir,
            outputDirectory: outputDir,
            overwrite: opts.overwrite,
          },
          context,
        );

        await writeGenerationManifest(outputDir);
      },
    );

  // test-project save <test-name>
  testProjectCommand
    .command('save <test-name>')
    .description(
      'Save the current state of generated-tests/<test-name>/ as snapshots',
    )
    .option(
      '--test-projects-dir <dir>',
      'Directory containing test projects',
      DEFAULT_TEST_PROJECTS_DIR,
    )
    .action(async (testName: string, opts: { testProjectsDir: string }) => {
      const testProjectDir = resolveTestProjectDir(
        testName,
        opts.testProjectsDir,
      );
      const outputDir = resolveOutputDir(testName);

      if (!(await dirExists(outputDir))) {
        throw new Error(
          `Generated test output not found at ${outputDir}. Run 'baseplate-dev test-project generate ${testName}' first.`,
        );
      }

      console.warn(
        '⚠️  This will overwrite any existing snapshots for this test project.',
      );
      const proceed: boolean = await confirm({
        message: `Save snapshots for test project '${testName}'?`,
        default: false,
      });

      if (!proceed) {
        logger.info('Aborted test save.');
        return;
      }

      logger.info(`Saving snapshots for test project '${testName}'...`);
      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        testProjectSaveAction,
        {
          testProjectDirectory: testProjectDir,
          outputDirectory: outputDir,
        },
        context,
      );
    });

  // test-project run-env <test-name>
  testProjectCommand
    .command('run-env <test-name>')
    .description('Start a test project environment and wait (for development)')
    .option(
      '--test-defs-dir <dir>',
      'Directory containing test definition files (*.gen.ts)',
      DEFAULT_TEST_DEFS_DIR,
    )
    .action(async (testName: string, opts: { testDefsDir: string }) => {
      const outputDir = path.resolve(DEFAULT_OUTPUT_DIR);
      const projectDirectoryPath = path.join(outputDir, testName);
      const testDefinitionsDir = path.resolve(opts.testDefsDir);

      // Check if generated project exists
      try {
        await fs.access(path.join(projectDirectoryPath, 'package.json'));
      } catch {
        throw new Error(
          `Project directory ${projectDirectoryPath} does not contain a package.json file. ` +
            `Run 'baseplate-dev test-project generate ${testName} --overwrite' first.`,
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
