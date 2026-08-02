// @ts-nocheck

import { acquireWorkerDatabase } from '$dbTestHelper';

// Runs once per test file, before the file's imports are evaluated, to point
// this worker at its own database. This must only import db.test-helper:
// pulling in anything that reaches src/services/prisma.ts would construct the
// Prisma client (and cache the config) against the maintenance database.
const maintenanceDatabaseUrl = process.env.TEST_MAINTENANCE_DATABASE_URL;

if (process.env.TEST_MODE !== 'unit' && maintenanceDatabaseUrl) {
  process.env.DATABASE_URL = await acquireWorkerDatabase(
    maintenanceDatabaseUrl,
  );
}
