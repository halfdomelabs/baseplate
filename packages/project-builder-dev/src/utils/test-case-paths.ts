import path from 'node:path';

const TEST_CASES_DIR = 'tests';
const GENERATED_TESTS_DIR = 'generated-tests';

/**
 * Resolves the path to a test case directory.
 * @param rootDir - The root of the Baseplate repository
 * @param testName - The name of the test case
 */
export function resolveTestCaseDirectory(
  rootDir: string,
  testName: string,
): string {
  return path.join(rootDir, TEST_CASES_DIR, testName);
}

/**
 * Resolves the path to the expanded generated output directory for a test case.
 * @param rootDir - The root of the Baseplate repository
 * @param testName - The name of the test case
 */
export function resolveGeneratedTestDirectory(
  rootDir: string,
  testName: string,
): string {
  return path.join(rootDir, GENERATED_TESTS_DIR, testName);
}
