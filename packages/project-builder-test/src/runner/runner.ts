import { generateProject } from '@baseplate-dev/project-builder-dev';
import path from 'node:path';

import type {
  ProjectBuilderTest,
  TestRunnerContext,
  TestRunnerHelpers,
} from '#src/types.js';

import { createEnvironmentHelpers } from '#src/environment/index.js';
import { logger } from '#src/utils/console.js';
import {
  getTestProjectsDirectory,
  getTestsDirectory,
} from '#src/utils/directories.js';

import { discoverTests } from './discover-tests.js';

async function runTest(test: ProjectBuilderTest): Promise<void> {
  const testProjectsDirectory = await getTestProjectsDirectory();
  const projectDirectoryPath = path.join(
    testProjectsDirectory,
    test.projectDirectory,
  );

  // Generate project
  logger.log(`Generating project for ${test.projectDirectory}...`);
  const result = await generateProject(projectDirectoryPath);

  if (result.status !== 'success') {
    throw new Error(`Project generation failed: ${result.status}`);
  }
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
