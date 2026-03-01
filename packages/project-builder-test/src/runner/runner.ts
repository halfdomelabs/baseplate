import { expandTestCase } from '@baseplate-dev/project-builder-server/actions';
import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';
import { getPackageVersion } from '@baseplate-dev/utils/node';
import path from 'node:path';

import type {
  ProjectBuilderTest,
  TestRunnerContext,
  TestRunnerHelpers,
} from '#src/types.js';

import { createEnvironmentHelpers } from '#src/environment/index.js';
import { logger } from '#src/utils/console.js';
import {
  getGeneratedTestsDirectory,
  getTestProjectsDirectory,
  getTestsDirectory,
} from '#src/utils/directories.js';

import { discoverTests } from './discover-tests.js';

async function runTest(test: ProjectBuilderTest): Promise<void> {
  const testProjectsDirectory = await getTestProjectsDirectory();
  const generatedTestsDirectory = await getGeneratedTestsDirectory();

  const testCaseDir = path.join(testProjectsDirectory, test.projectDirectory);
  const projectDirectoryPath = path.join(
    generatedTestsDirectory,
    test.projectDirectory,
  );

  // Expand test case (generate + apply snapshots)
  logger.log(`Generating project for ${test.projectDirectory}...`);
  const plugins = await discoverPlugins(process.cwd(), logger);
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';
  await expandTestCase(
    testCaseDir,
    projectDirectoryPath,
    logger,
    plugins,
    cliVersion,
    {},
  );
  logger.log(`Project generated for ${test.projectDirectory}!`);

  const context: TestRunnerContext = {
    projectDirectoryPath,
    streamCommandOutput: false,
  };

  const environmentHelpers = createEnvironmentHelpers(context);

  try {
    await test.setupEnvironment(context, environmentHelpers);

    const helpers: TestRunnerHelpers = {
      runCommand: environmentHelpers.runCommand,
    };

    logger.log(
      `Environment set up. Running tests for ${test.projectDirectory}...`,
    );

    await test.runTests(context, helpers);
    await environmentHelpers.shutdown(false);
  } catch (err) {
    await environmentHelpers.shutdown(true);
    throw err;
  }
}

export async function runTests(filter: string): Promise<void> {
  const testDirectory = await getTestsDirectory();
  const tests = await discoverTests(testDirectory, filter);

  logger.log(`Found ${tests.length} matching tests!`);

  for (const test of tests) {
    logger.log(`Running test: ${test.filename}`);
    await runTest(test.content);
    logger.log(`Test ${test.filename} completed!`);
  }
}
