// @ts-nocheck

import {
  ensureWorkerDatabase,
  getWorkerDatabaseUrl,
} from '$workerDatabaseTestHelper';

// Runs once per test file, before the file's imports are evaluated, to point
// this worker at its own database. Nothing here may reach
// src/services/prisma.ts, which would cache its config against the maintenance
// database.
const maintenanceDatabaseUrl = process.env.TEST_MAINTENANCE_DATABASE_URL;
const runId = process.env.TEST_RUN_ID;
const markerDirectory = process.env.TEST_WORKER_MARKER_DIRECTORY;

if (
  process.env.TEST_MODE !== 'unit' &&
  maintenanceDatabaseUrl &&
  runId &&
  markerDirectory
) {
  await ensureWorkerDatabase(markerDirectory, async () => {
    // Dynamic so that files which never clone don't load the Prisma client
    // db.test-helper reaches for. Keep worker-database.test-helper free of it
    // too, since that one is imported statically above.
    const { acquireWorkerDatabase } = await import(TPL_DB_TEST_HELPER_PATH);
    await acquireWorkerDatabase(maintenanceDatabaseUrl, runId);
  });
  process.env.DATABASE_URL = getWorkerDatabaseUrl(
    maintenanceDatabaseUrl,
    runId,
  );
}
