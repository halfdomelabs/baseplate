import type { Command } from 'commander';

import fs from 'node:fs/promises';
import path from 'node:path';

import { createEnvironmentHelpers } from '#src/environment/index.js';
import { discoverTests } from '#src/runner/discover-tests.js';
import { logger } from '#src/utils/console.js';
import {
  getTestProjectsDirectory,
  getTestsDirectory,
} from '#src/utils/directories.js';
import { waitForSignal } from '#src/utils/wait-for-signal.js';

async function runTestProject(projectName: string): Promise<void> {
  const testsDirectory = await getTestsDirectory();
  const tests = await discoverTests(testsDirectory);

  // Find test for project name
  const test = tests.find((t) => t.content.projectDirectory === projectName);

  if (!test) {
    throw new Error(`No test found for project ${projectName}`);
  }

  logger.log(`Starting project environment for ${projectName}...`);

  const testProjectsDirectory = await getTestProjectsDirectory();
  const projectDirectoryPath = path.join(
    testProjectsDirectory,
    test.content.projectDirectory,
  );

  // check if project directory package.json exists
  try {
    await fs.access(path.join(projectDirectoryPath, 'package.json'));
  } catch {
    throw new Error(
      `Project directory ${projectDirectoryPath} does not contain a package.json file`,
    );
  }

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
}

export function addCliRunCommand(program: Command): void {
  program
    .command('run')
    .argument('<projectName>', 'The project to run')
    .description('Runs the project dev environment')
    .action(runTestProject);
}
