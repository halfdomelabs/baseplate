import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  testCaseGenerateAction,
  testCaseInitAction,
  testCaseSaveAction,
} from '@baseplate-dev/project-builder-server/actions';
import { dirExists } from '@baseplate-dev/utils/node';
import { confirm } from '@inquirer/prompts';
import path from 'node:path';

import { logger } from '#src/services/logger.js';
import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import {
  resolveGeneratedTestDirectory,
  resolveTestCaseDirectory,
} from '#src/utils/test-case-paths.js';

/**
 * Finds the repository root by walking up from process.cwd() until a
 * `tests/` directory is found.
 */
async function findRepoRoot(): Promise<string> {
  let dir = process.cwd();

  while (true) {
    const candidate = path.join(dir, 'tests');
    if (await dirExists(candidate)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a tests/ directory walking up from ${process.cwd()}. ` +
          'Run this command from within the Baseplate repository.',
      );
    }
    dir = parent;
  }
}

/**
 * Adds the test case management commands to the program.
 */
export function addTestCommand(program: Command): void {
  const testCommand = program
    .command('test')
    .description('Manage test cases for Baseplate project generation');

  // test init command
  testCommand
    .command('init <test-name>')
    .description(
      'Create a new test case with an initial project definition in tests/<test-name>/',
    )
    .action(async (testName: string) => {
      const rootDir = await findRepoRoot();
      const testCaseDir = resolveTestCaseDirectory(rootDir, testName);

      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        testCaseInitAction,
        { testCaseDirectory: testCaseDir, testName },
        context,
      );
    });

  // test generate command
  testCommand
    .command('generate <test-name>')
    .description(
      'Generate test case output to generated-tests/<test-name>/ and apply snapshots',
    )
    .action(async (testName: string) => {
      const rootDir = await findRepoRoot();
      const testCaseDir = resolveTestCaseDirectory(rootDir, testName);
      const outputDir = resolveGeneratedTestDirectory(rootDir, testName);

      logger.info(`Generating test case '${testName}'...`);
      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        testCaseGenerateAction,
        { testCaseDirectory: testCaseDir, outputDirectory: outputDir },
        context,
      );
    });

  // test save command
  testCommand
    .command('save <test-name>')
    .description(
      'Save the current state of generated-tests/<test-name>/ as snapshots in tests/<test-name>/snapshots/',
    )
    .action(async (testName: string) => {
      const rootDir = await findRepoRoot();
      const testCaseDir = resolveTestCaseDirectory(rootDir, testName);
      const outputDir = resolveGeneratedTestDirectory(rootDir, testName);

      if (!(await dirExists(outputDir))) {
        throw new Error(
          `Generated test output not found at ${outputDir}. Run 'baseplate-dev test generate ${testName}' first.`,
        );
      }

      console.warn(
        '⚠️  This will overwrite any existing snapshots for this test case.',
      );
      const proceed: boolean = await confirm({
        message: `Save snapshots for test case '${testName}'?`,
        default: false,
      });

      if (!proceed) {
        logger.info('Aborted test save.');
        return;
      }

      logger.info(`Saving snapshots for test case '${testName}'...`);
      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        testCaseSaveAction,
        { testCaseDirectory: testCaseDir, outputDirectory: outputDir },
        context,
      );
    });
}
