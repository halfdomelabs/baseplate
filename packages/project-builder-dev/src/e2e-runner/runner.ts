import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';

import {
  assertNotStale,
  invokeServiceActionAsCli,
  syncProjectAction,
} from '@baseplate-dev/project-builder-server/actions';

import type { ProjectBuilderTest, TestRunnerHelpers } from './types.js';

import { discoverTests } from './discover-tests.js';
import { createEnvironmentHelpers } from './environment.js';

export interface RunTestsOptions {
  /** Directory where **.gen.ts files live */
  testDefinitionsDir: string;
  /** Discovered test projects to run against */
  testProjects: ProjectInfo[];
  /** Service action context with plugins, config, and logger */
  context: ServiceActionContext;
  /** Optional filter to match test files by substring */
  filter?: string;
}

async function runTest(
  test: ProjectBuilderTest,
  projectInfo: ProjectInfo,
  context: ServiceActionContext,
): Promise<void> {
  const { directory: outputDir } = projectInfo;

  // Check if the output directory has been modified since last generation
  await assertNotStale(outputDir);

  // Generate test project using the sync service action
  console.info(`Generating project for ${test.projectDirectory}...`);

  const result = await invokeServiceActionAsCli(
    syncProjectAction,
    { project: projectInfo.name, overwrite: true },
    context,
  );

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
  const { testDefinitionsDir, testProjects, context, filter } = options;
  const tests = await discoverTests(testDefinitionsDir, filter);

  console.info(`Found ${tests.length} matching tests!`);

  for (const test of tests) {
    // Match test definition to discovered project by name (strip "test:" prefix)
    const projectInfo = testProjects.find(
      (p) => p.name === `test:${test.content.projectDirectory}`,
    );
    if (!projectInfo) {
      throw new Error(
        `No test project found for "${test.content.projectDirectory}". ` +
          `Available test projects: ${testProjects.map((p) => p.name).join(', ')}`,
      );
    }

    console.info(`Running test: ${test.filename}`);
    await runTest(test.content, projectInfo, context);
    console.info(`Test ${test.filename} completed!`);
  }
}
