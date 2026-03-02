import { expandTestProject } from '@baseplate-dev/project-builder-server/actions';
import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';
import { dirExists, getPackageVersion } from '@baseplate-dev/utils/node';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import type { ProjectBuilderTest, TestRunnerHelpers } from './types.js';

import { discoverTests } from './discover-tests.js';
import { createEnvironmentHelpers } from './environment.js';

export interface RunTestsOptions {
  /** Directory where **.gen.ts files live */
  testDefinitionsDir: string;
  /** Directory where test project data lives (project-definition.json + snapshots) */
  testProjectsDir: string;
  /** Directory for generated test output */
  outputDir: string;
  /** Optional filter to match test files by substring */
  filter?: string;
}

async function runTest(
  test: ProjectBuilderTest,
  testProjectsDir: string,
  outputDir: string,
): Promise<void> {
  const testProjectDir = path.join(testProjectsDir, test.projectDirectory);
  const projectDirectoryPath = path.join(outputDir, test.projectDirectory);

  // Clean output directory before generating
  if (await dirExists(projectDirectoryPath)) {
    await rm(projectDirectoryPath, { recursive: true, force: true });
  }

  // Expand test project (generate + apply snapshots)
  console.info(`Generating project for ${test.projectDirectory}...`);
  const plugins = await discoverPlugins(process.cwd(), console);
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';
  await expandTestProject(
    testProjectDir,
    projectDirectoryPath,
    console,
    plugins,
    cliVersion,
    {},
  );

  console.info(`Project generated for ${test.projectDirectory}!`);

  const context = {
    projectDirectoryPath,
    streamCommandOutput: false,
  };

  const environmentHelpers = createEnvironmentHelpers(context);

  try {
    await test.setupEnvironment(context, environmentHelpers);

    const helpers: TestRunnerHelpers = {
      runCommand: environmentHelpers.runCommand,
    };

    console.info(
      `Environment set up. Running tests for ${test.projectDirectory}...`,
    );

    await test.runTests(context, helpers);
    await environmentHelpers.shutdown(false);
  } catch (err) {
    await environmentHelpers.shutdown(true);
    console.error(
      `Test failed. Output preserved at ${projectDirectoryPath} for debugging.`,
    );
    throw err;
  }
}

export async function runTests(options: RunTestsOptions): Promise<void> {
  const { testDefinitionsDir, testProjectsDir, outputDir, filter } = options;
  const tests = await discoverTests(testDefinitionsDir, filter);

  console.info(`Found ${tests.length} matching tests!`);

  for (const test of tests) {
    const projectDirectoryPath = path.join(
      outputDir,
      test.content.projectDirectory,
    );

    console.info(`Running test: ${test.filename}`);
    await runTest(test.content, testProjectsDir, outputDir);
    console.info(`Test ${test.filename} completed!`);

    // Auto-cleanup on success
    if (await dirExists(projectDirectoryPath)) {
      await rm(projectDirectoryPath, { recursive: true, force: true });
      console.info(`Cleaned up ${projectDirectoryPath}.`);
    }
  }
}
