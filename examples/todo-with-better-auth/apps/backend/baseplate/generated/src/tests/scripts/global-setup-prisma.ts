import type { TestProject } from 'vitest/node';

import {
  createTemplateDatabase,
  dropStaleTestDatabases,
} from '../helpers/db.test-helper.js';
import { clearWorkerDatabaseRecords } from '../helpers/worker-database.test-helper.js';

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

  // Sweep first so a previously crashed run cannot leak worker databases.
  await dropStaleTestDatabases(DATABASE_URL);
  clearWorkerDatabaseRecords();
  await createTemplateDatabase(DATABASE_URL);

  // Workers clone their own database from the template in setup-db.ts.
  // DATABASE_URL is left pointing at the maintenance database, which is the
  // only connection allowed to issue CREATE/DROP DATABASE.
  project.config.env.TEST_MAINTENANCE_DATABASE_URL = DATABASE_URL;

  console.info('\nTest database template created and migrations ran!');

  return async () => {
    await dropStaleTestDatabases(DATABASE_URL, { keepTemplate: true });
    clearWorkerDatabaseRecords();
  };
}
