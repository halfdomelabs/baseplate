import path from 'node:path';

export const TEST_PROJECT_DEFINITION_FILENAME = 'project-definition.json';
const TEST_PROJECT_SNAPSHOTS_DIRNAME = 'snapshots';

/**
 * Resolves the path to the snapshot directory for a specific app within a test project.
 * Uses the app name (e.g. "backend"), not the package directory (e.g. "apps/backend").
 * @param testProjectDir - The test project directory
 * @param appName - The app name from the project definition
 */
export function resolveTestProjectSnapshotDirectory(
  testProjectDir: string,
  appName: string,
): string {
  return path.join(testProjectDir, TEST_PROJECT_SNAPSHOTS_DIRNAME, appName);
}
