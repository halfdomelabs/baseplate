import { loadEnvFile } from 'node:process';

import { createTestDatabase } from '../helpers/db.test-helper.js';

loadEnvFile('.env');

export default async function setup(): Promise<void> {
  /* TPL_OPERATIONS:START */

  const { TEST_MODE } = process.env;

  // don't run database set-up if only running unit tests
  if (TEST_MODE !== 'unit') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    // create separate test DB
    const testDatabaseUrl = await createTestDatabase(process.env.DATABASE_URL);

    // back up original database URL
    process.env.ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
    process.env.DATABASE_URL = testDatabaseUrl;

    console.info('\nDatabase migrations ran!');
  }

  /* TPL_OPERATIONS:END */
}
