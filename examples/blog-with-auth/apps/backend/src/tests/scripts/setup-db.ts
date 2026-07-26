import { acquireWorkerDatabase } from '../helpers/db.test-helper.js';

// Runs once per test file, before the file's imports are evaluated. This must
// only import db.test-helper: pulling in anything that reaches src/services/config.ts
// would freeze the Prisma singleton against the maintenance database.
const maintenanceDatabaseUrl = process.env.TEST_MAINTENANCE_DATABASE_URL;

if (process.env.TEST_MODE !== 'unit' && maintenanceDatabaseUrl) {
  process.env.DATABASE_URL = await acquireWorkerDatabase(
    maintenanceDatabaseUrl,
  );
}
