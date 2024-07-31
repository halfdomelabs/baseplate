import { discoverTests } from './discover-tests.js';
import { logger } from '@src/utils/console.js';
import { getTestsDirectory } from '@src/utils/directories.js';

export async function runTests(filter: string): Promise<void> {
  const testDirectory = await getTestsDirectory();
  const tests = await discoverTests(testDirectory, filter);

  logger.log(`Found ${tests.length} matching tests!`);

  for (const test of tests) {
    logger.log(`Running test: ${test.filename}`);
    await test.content.runTests();
  }
}
