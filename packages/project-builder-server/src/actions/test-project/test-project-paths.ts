import path from 'node:path';

export const TEST_CASE_DEFINITION_FILENAME = 'project-definition.json';
const TEST_CASE_SNAPSHOTS_DIRNAME = 'snapshots';

/**
 * Resolves the path to the snapshot directory for a specific app within a test case.
 * Uses the app name (e.g. "backend"), not the package directory (e.g. "apps/backend").
 * @param testCaseDir - The test case directory
 * @param appName - The app name from the project definition
 */
export function resolveTestCaseSnapshotDirectory(
  testCaseDir: string,
  appName: string,
): string {
  return path.join(testCaseDir, TEST_CASE_SNAPSHOTS_DIRNAME, appName);
}
