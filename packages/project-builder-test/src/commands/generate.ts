import type { Command } from 'commander';

import path from 'node:path';

import { discoverTests } from '#src/runner/discover-tests.js';
import { generateProject } from '#src/runner/generate.js';
import { logger } from '#src/utils/console.js';
import {
  getTestProjectsDirectory,
  getTestsDirectory,
} from '#src/utils/directories.js';

async function generateTestProjects(filter: string): Promise<void> {
  const testsDirectory = await getTestsDirectory();
  const tests = await discoverTests(testsDirectory, filter);

  const testProjectsDirectory = await getTestProjectsDirectory();

  logger.log(`Found ${tests.length} matching tests!`);
  for (const test of tests) {
    const projectDirectoryPath = path.join(
      testProjectsDirectory,
      test.content.projectDirectory,
    );
    await generateProject(projectDirectoryPath);
  }
}

export function addCliGenerateCommand(program: Command): void {
  program
    .command('generate')
    .argument('[filter]', 'Filter tests by substring')
    .description('Generates test projects')
    .action(generateTestProjects);
}
