import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import path from 'node:path';

import { PrismaClient } from '@src/generated/prisma/client.js';

const TEST_DATABASE_NAME =
  /* TPL_TEST_DB:START */ 'todo_with_better_auth_backend_test'; /* TPL_TEST_DB:END */

/** Database cloned by each worker; never connected to by tests directly. */
const TEMPLATE_DATABASE_NAME = `${TEST_DATABASE_NAME}_template`;

/**
 * Postgres rejects `CREATE DATABASE ... WITH TEMPLATE` while another session is
 * connected to the template, so concurrent workers can collide transiently.
 */
const CLONE_MAX_ATTEMPTS = 5;

/**
 * Quotes a Postgres identifier for safe interpolation into DDL.
 *
 * `CREATE`/`DROP DATABASE` take no bind parameters, so names must be inlined.
 * Double-quoting (with embedded quotes doubled) is the standard-conformant way
 * to do that for an arbitrary name, including one read back from `pg_database`.
 *
 * @param identifier Identifier to quote.
 * @returns The double-quoted identifier.
 */
function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

/**
 * Returns the 1-based Vitest worker slot for the current process.
 *
 * `VITEST_POOL_ID` is bounded by `maxWorkers` and stays fixed for a process's
 * lifetime, so it yields at most `maxWorkers` databases. `VITEST_WORKER_ID`
 * looks similar but increments per test *file*, which would create one database
 * per file. Falls back to 1 outside a worker (e.g. in global setup).
 */
export function getTestWorkerId(): number {
  const poolId = Number(process.env.VITEST_POOL_ID ?? '1');
  return Number.isInteger(poolId) && poolId > 0 ? poolId : 1;
}

/** Returns the database name for a given worker slot. */
export function getWorkerDatabaseName(workerId: number): string {
  return `${TEST_DATABASE_NAME}_${workerId}`;
}

/**
 * Replaces the database name in a Postgres connection string, preserving
 * credentials, port and query parameters such as `?schema=public`.
 *
 * @param connectionString Source connection string.
 * @param database Database name to switch to.
 * @returns The rewritten connection string.
 */
export function replaceDatabase(
  connectionString: string,
  database: string,
): string {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
}

/**
 * Creates a Prisma client for an arbitrary database URL.
 *
 * @param databaseUrl Database to connect to.
 * @returns A new client; the caller owns disconnection.
 */
export function getTestPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

/**
 * Runs a callback against a maintenance connection.
 *
 * `CREATE`/`DROP DATABASE` cannot run against the database being modified, so
 * DDL is always issued via the original (non-test) database.
 */
async function withMaintenanceClient<T>(
  databaseUrl: string,
  callback: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  const client = getTestPrisma(databaseUrl);
  try {
    return await callback(client);
  } finally {
    await client.$disconnect();
  }
}

/**
 * Drops every database left over from a previous run, optionally sparing the
 * template.
 *
 * Sweeping at start-up rather than relying on teardown makes cleanup
 * self-healing: a crashed or cancelled run cannot leak databases into the next.
 *
 * @param databaseUrl Maintenance database URL.
 * @param options.keepTemplate Retain the template database.
 * @returns Names of the databases dropped.
 */
export async function dropStaleTestDatabases(
  databaseUrl: string,
  { keepTemplate = false }: { keepTemplate?: boolean } = {},
): Promise<string[]> {
  // The LIKE query is only a coarse prefilter (`_` is a LIKE wildcard); this
  // pattern is the authoritative allowlist of what we may DROP. Safe to embed
  // unescaped since TEST_DATABASE_NAME is validated to `[a-z0-9_]` at generation.
  const workerDatabasePattern = new RegExp(
    String.raw`^${TEST_DATABASE_NAME}_\d+$`,
  );

  return withMaintenanceClient(databaseUrl, async (client) => {
    const rows = await client.$queryRaw<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname LIKE ${`${TEST_DATABASE_NAME}%`}
    `;

    const dropped: string[] = [];
    for (const { datname } of rows) {
      const isTemplate = datname === TEMPLATE_DATABASE_NAME;
      const isWorkerDatabase = workerDatabasePattern.test(datname);
      if (!isTemplate && !isWorkerDatabase) continue;
      if (keepTemplate && isTemplate) continue;
      // FORCE terminates lingering connections that would otherwise block the drop.
      await client.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${quoteIdentifier(datname)} WITH (FORCE)`,
      );
      dropped.push(datname);
    }
    return dropped;
  });
}

/**
 * Creates the template database and applies all migrations to it.
 *
 * Called once per run from global setup; workers clone the result instead of
 * each paying for `prisma migrate deploy`.
 *
 * @param databaseUrl Maintenance database URL.
 * @returns The template database's connection string.
 */
export async function createTemplateDatabase(
  databaseUrl: string,
): Promise<string> {
  const quotedTemplate = quoteIdentifier(TEMPLATE_DATABASE_NAME);

  await withMaintenanceClient(databaseUrl, async (client) => {
    await client.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS ${quotedTemplate} WITH (FORCE)`,
    );
    await client.$executeRawUnsafe(`CREATE DATABASE ${quotedTemplate}`);
  });

  const templateDatabaseUrl = replaceDatabase(
    databaseUrl,
    TEMPLATE_DATABASE_NAME,
  );

  execSync('pnpm prisma migrate deploy', {
    cwd: path.resolve(import.meta.dirname, '../../../'),
    env: {
      ...process.env,
      DATABASE_URL: templateDatabaseUrl,
    },
  });

  return templateDatabaseUrl;
}

/**
 * Returns a connection string for this worker's database, cloning it from the
 * template on first use.
 *
 * Idempotent by design: Vitest reuses a worker slot across successive test
 * files, each in a fresh process, so an existing database is the normal case
 * rather than an error. Per-test cleanup hooks keep it usable.
 *
 * @param databaseUrl Maintenance database URL.
 * @returns This worker's database connection string.
 */
export async function acquireWorkerDatabase(
  databaseUrl: string,
): Promise<string> {
  const databaseName = getWorkerDatabaseName(getTestWorkerId());

  await withMaintenanceClient(databaseUrl, async (client) => {
    const existing = await client.$queryRaw<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${databaseName}
    `;
    if (existing.length > 0) return;

    for (let attempt = 1; ; attempt++) {
      try {
        await client.$executeRawUnsafe(
          `CREATE DATABASE ${quoteIdentifier(databaseName)} WITH TEMPLATE ${quoteIdentifier(TEMPLATE_DATABASE_NAME)}`,
        );
        return;
      } catch (error) {
        // Another worker cloning the same template holds a conflicting lock;
        // back off and retry rather than failing the whole file.
        if (attempt >= CLONE_MAX_ATTEMPTS) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * 2 ** (attempt - 1) + Math.random() * 100),
        );
      }
    }
  });

  return replaceDatabase(databaseUrl, databaseName);
}
