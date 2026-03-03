import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import { syncProject } from '@baseplate-dev/project-builder-server';
import { generateProjectId } from '@baseplate-dev/project-builder-server/actions';
import {
  createNodeSchemaParserContext,
  discoverPlugins,
} from '@baseplate-dev/project-builder-server/plugins';
import { getPackageVersion } from '@baseplate-dev/utils/node';
import path from 'node:path';

import type { ProjectBuilderTest, TestRunnerHelpers } from './types.js';

import { discoverTests } from './discover-tests.js';
import { createEnvironmentHelpers } from './environment.js';

export interface RunTestsOptions {
  /** Directory where **.gen.ts files live */
  testDefinitionsDir: string;
  /** Directory where test project data lives (e.g. tests/) */
  testProjectsDir: string;
  /** Optional filter to match test files by substring */
  filter?: string;
}

async function runTest(
  test: ProjectBuilderTest,
  testProjectsDir: string,
): Promise<void> {
  const testProjectDir = path.join(testProjectsDir, test.projectDirectory);
  const outputDir = path.join(testProjectDir, '.output');

  // Expand test project (generate + apply snapshots)
  console.info(`Generating project for ${test.projectDirectory}...`);
  const plugins = await discoverPlugins(process.cwd(), console);
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  const projectInfo: ProjectInfo = {
    id: generateProjectId(testProjectDir),
    name: `test:${test.projectDirectory}`,
    directory: outputDir,
    type: 'test',
    baseplateDirectory: testProjectDir,
  };

  const context = await createNodeSchemaParserContext(
    projectInfo,
    console,
    plugins,
    cliVersion,
    testProjectDir,
  );

  const result = await syncProject({
    directory: outputDir,
    logger: console,
    context,
    userConfig: {},
    overwrite: true,
    baseplateDirectory: testProjectDir,
  });

  if (result.status === 'error') {
    throw new Error(
      `Test project generation failed for ${test.projectDirectory}`,
    );
  }

  console.info(`Project generated for ${test.projectDirectory}!`);

  const runnerContext = {
    projectDirectoryPath: outputDir,
    streamCommandOutput: false,
  };

  const environmentHelpers = createEnvironmentHelpers(runnerContext);

  try {
    await test.setupEnvironment(runnerContext, environmentHelpers);

    const helpers: TestRunnerHelpers = {
      runCommand: environmentHelpers.runCommand,
    };

    console.info(
      `Environment set up. Running tests for ${test.projectDirectory}...`,
    );

    await test.runTests(runnerContext, helpers);
    await environmentHelpers.shutdown(false);
  } catch (err) {
    await environmentHelpers.shutdown(true);
    console.error(
      `Test failed. Output preserved at ${outputDir} for debugging.`,
    );
    throw err;
  }
}

export async function runTests(options: RunTestsOptions): Promise<void> {
  const { testDefinitionsDir, testProjectsDir, filter } = options;
  const tests = await discoverTests(testDefinitionsDir, filter);

  console.info(`Found ${tests.length} matching tests!`);

  for (const test of tests) {
    console.info(`Running test: ${test.filename}`);
    await runTest(test.content, testProjectsDir);
    console.info(`Test ${test.filename} completed!`);
  }
}
