import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import { syncProject } from '@baseplate-dev/project-builder-server';
import {
  assertNotStale,
  writeGenerationManifest,
} from '@baseplate-dev/project-builder-server/actions';
import {
  createNodeSchemaParserContext,
  discoverPlugins,
} from '@baseplate-dev/project-builder-server/plugins';
import { getPackageVersion } from '@baseplate-dev/utils/node';

import type { ProjectBuilderTest, TestRunnerHelpers } from './types.js';

import { discoverTests } from './discover-tests.js';
import { createEnvironmentHelpers } from './environment.js';

export interface RunTestsOptions {
  /** Directory where **.gen.ts files live */
  testDefinitionsDir: string;
  /** Discovered test projects to run against */
  testProjects: ProjectInfo[];
  /** Optional filter to match test files by substring */
  filter?: string;
}

async function runTest(
  test: ProjectBuilderTest,
  projectInfo: ProjectInfo,
): Promise<void> {
  const { directory: outputDir, baseplateDirectory } = projectInfo;

  // Check if the output directory has been modified since last generation
  await assertNotStale(outputDir);

  // Expand test project (generate + apply snapshots)
  console.info(`Generating project for ${test.projectDirectory}...`);
  const plugins = await discoverPlugins(process.cwd(), console);
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  const context = await createNodeSchemaParserContext(
    projectInfo,
    console,
    plugins,
    cliVersion,
    baseplateDirectory,
  );

  const result = await syncProject({
    directory: outputDir,
    logger: console,
    context,
    userConfig: {},
    overwrite: true,
    baseplateDirectory,
  });

  if (result.status === 'error') {
    throw new Error(
      `Test project generation failed for ${test.projectDirectory}`,
    );
  }

  await writeGenerationManifest(outputDir);
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
  const { testDefinitionsDir, testProjects, filter } = options;
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
    await runTest(test.content, projectInfo);
    console.info(`Test ${test.filename} completed!`);
  }
}
