import type { TestProject } from 'vitest/node';

import {
  createTemplateDatabase,
  dropRunTestDatabases,
  reclaimStaleTestDatabases,
} from '../helpers/db.test-helper.js';
import {
  createTestRunId,
  createWorkerMarkerDirectory,
  removeWorkerMarkerDirectory,
} from '../helpers/worker-database.test-helper.js';

export default async function setup(
  project: TestProject,
): Promise<() => Promise<void>> {
  const { TEST_MODE, DATABASE_URL } = project.config.env;

  // don't run database set-up if only running unit tests
  if (TEST_MODE === 'unit') {
    return () => Promise.resolve();
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // Every database and marker this run touches is namespaced by this id, so
  // runs sharing a Postgres instance never collide. Vitest runs global setup
  // once per session, which keeps the id stable across watch-mode reruns.
  const runId = createTestRunId();
  const markerDirectory = createWorkerMarkerDirectory(runId);

  const cleanUpRun = async (): Promise<void> => {
    await dropRunTestDatabases(DATABASE_URL, runId);
    removeWorkerMarkerDirectory(markerDirectory);
  };

  try {
    await reclaimStaleTestDatabases(DATABASE_URL);
    await createTemplateDatabase(DATABASE_URL, runId);
  } catch (error) {
    await cleanUpRun().catch((cleanUpError: unknown) => {
      console.warn(`Failed to clean up test run ${runId}:`, cleanUpError);
    });
    throw error;
  }

  // Workers clone their own database from the template in setup-db.ts.
  // DATABASE_URL is left pointing at the maintenance database, which is the
  // only connection allowed to issue CREATE/DROP DATABASE.
  project.config.env.TEST_MAINTENANCE_DATABASE_URL = DATABASE_URL;
  project.config.env.TEST_RUN_ID = runId;
  project.config.env.TEST_WORKER_MARKER_DIRECTORY = markerDirectory;

  console.info('\nTest database template created and migrations ran!');

  return cleanUpRun;
}
