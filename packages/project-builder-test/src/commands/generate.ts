import { Command } from 'commander';

import { discoverTests } from '@src/runner/discover-tests.js';
import { logger } from '@src/utils/console.js';
import { getTestsDirectory } from '@src/utils/directories.js';

async function generateTestProjects(filter: string): Promise<void> {
  const testsDirectory = await getTestsDirectory();
  const tests = await discoverTests(testsDirectory, filter);

  logger.log(tests.map((t) => t.filename).join('\n'));
}

export function addCliGenerateCommand(program: Command): void {
  program
    .command('generate')
    .argument('[filter]', 'Filter tests by substring')
    .description('Generates test projects')
    .action(generateTestProjects);
}
