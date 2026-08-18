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

if (process.env.TEST_MODE !== 'unit' && maintenanceDatabaseUrl) {
  await ensureWorkerDatabase(async () => {
    // Dynamic so that files which never clone don't load the Prisma client
    // db.test-helper reaches for. Keep worker-database.test-helper free of it
    // too, since that one is imported statically above.
    const { acquireWorkerDatabase } = await import(TPL_DB_TEST_HELPER_PATH);
    await acquireWorkerDatabase(maintenanceDatabaseUrl);
  });
  process.env.DATABASE_URL = getWorkerDatabaseUrl(maintenanceDatabaseUrl);
}
