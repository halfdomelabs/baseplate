import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import path from 'node:path';

import { PrismaClient } from '@src/generated/prisma/client.js';

import {
  getTemplateDatabaseName,
  getTemplateDatabaseUrl,
  getWorkerDatabaseName,
  parseTestDatabaseName,
  TEST_DATABASE_NAME,
} from './worker-database.test-helper.js';

/**
 * Postgres rejects `CREATE DATABASE ... WITH TEMPLATE` while another session is
 * connected to the template, so concurrent workers can collide transiently.
 */
const CLONE_MAX_ATTEMPTS = 5;

/**
 * Age past which a run's databases are treated as leaked and reclaimed.
 *
 * A watch-mode run keeps one run id for as long as it is left running and holds
 * no connections while idle, so the cutoff must outlast any plausible session.
 */
const STALE_DATABASE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Postgres SQLSTATE raised when a database still has sessions connected. */
const OBJECT_IN_USE_SQLSTATE = '55006';

/**
 * Quotes a Postgres identifier for safe interpolation into DDL.
 *
 * `CREATE`/`DROP DATABASE` take no bind parameters, so names must be inlined.
 *
 * @param identifier Identifier to quote.
 * @returns The double-quoted identifier.
 */
function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

/**
 * Detects the error a plain `DROP DATABASE` raises while sessions are connected.
 *
 * Prisma reports raw-query failures as `P2010` and nests the SQLSTATE under
 * `meta.driverAdapterError`.
 *
 * @param error Error thrown by the drop.
 * @returns Whether the database is still in use.
 */
function isDatabaseInUseError(error: unknown): boolean {
  if (!(error instanceof Error) || !('meta' in error)) return false;
  const { driverAdapterError } = error.meta as {
    driverAdapterError?: { cause?: { code?: string } };
  };
  return driverAdapterError?.cause?.code === OBJECT_IN_USE_SQLSTATE;
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
 * Lists the databases belonging to any run of this project's test suite.
 *
 * The `LIKE` query is only a coarse prefilter (`_` is a LIKE wildcard); the name
 * parser is the authoritative allowlist of what may be dropped.
 */
async function listTestDatabases(client: PrismaClient): Promise<string[]> {
  const rows = await client.$queryRaw<{ datname: string }[]>`
    SELECT datname FROM pg_database WHERE datname LIKE ${`${TEST_DATABASE_NAME}%`}
  `;
  return rows.map(({ datname }) => datname);
}

/**
 * Reports whether any session is connected to one of the given databases.
 *
 * Covers a whole namespace at once, so a run holding just one of its databases
 * open is not reclaimed by halves.
 */
async function hasActiveConnections(
  client: PrismaClient,
  databases: string[],
): Promise<boolean> {
  const rows = await client.$queryRaw<{ inUse: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_stat_activity WHERE datname = ANY(${databases})
    ) AS "inUse"
  `;
  return rows[0]?.inUse ?? false;
}

/**
 * Groups the databases of runs that are past the reclamation cutoff by run id.
 */
function groupStaleDatabasesByRun(databases: string[]): Map<string, string[]> {
  const staleByRun = new Map<string, string[]>();

  for (const datname of databases) {
    const parsed = parseTestDatabaseName(datname);
    if (!parsed) continue;
    if (Date.now() - parsed.createdAt <= STALE_DATABASE_MAX_AGE_MS) continue;

    staleByRun.set(parsed.runId, [
      ...(staleByRun.get(parsed.runId) ?? []),
      datname,
    ]);
  }

  return staleByRun;
}

/**
 * Drops the databases of runs that ended without cleaning up after themselves.
 *
 * A namespace is reclaimed whole or not at all: dropping half of one would
 * leave a run with worker databases but no template to restore them from.
 *
 * The drop omits `WITH (FORCE)`, so Postgres refuses it while another run is
 * connected.
 *
 * @param databaseUrl Maintenance database URL.
 * @returns Names of the databases dropped.
 */
export async function reclaimStaleTestDatabases(
  databaseUrl: string,
): Promise<string[]> {
  return withMaintenanceClient(databaseUrl, async (client) => {
    const staleByRun = groupStaleDatabasesByRun(
      await listTestDatabases(client),
    );

    const dropped: string[] = [];
    for (const databases of staleByRun.values()) {
      if (await hasActiveConnections(client, databases)) continue;

      for (const datname of databases) {
        try {
          await client.$executeRawUnsafe(
            `DROP DATABASE IF EXISTS ${quoteIdentifier(datname)}`,
          );
          dropped.push(datname);
        } catch (error) {
          // A session opened since the check above, so the run is alive after
          // all; leave the rest of its namespace for the next run to reclaim.
          if (isDatabaseInUseError(error)) break;
          console.warn(`Failed to reclaim test database ${datname}:`, error);
        }
      }
    }
    return dropped;
  });
}

/**
 * Drops every database created by the given run.
 *
 * @param databaseUrl Maintenance database URL.
 * @param runId Run whose databases to drop.
 */
export async function dropRunTestDatabases(
  databaseUrl: string,
  runId: string,
): Promise<void> {
  await withMaintenanceClient(databaseUrl, async (client) => {
    const databases = (await listTestDatabases(client)).filter(
      (datname) => parseTestDatabaseName(datname)?.runId === runId,
    );

    for (const datname of databases) {
      // FORCE terminates our own lingering connections, which would otherwise
      // block the drop.
      await client.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${quoteIdentifier(datname)} WITH (FORCE)`,
      );
    }
  });
}

/**
 * Creates this run's template database and applies all migrations to it.
 *
 * @param databaseUrl Maintenance database URL.
 * @param runId This run's id.
 * @returns The template database's connection string.
 */
export async function createTemplateDatabase(
  databaseUrl: string,
  runId: string,
): Promise<string> {
  await withMaintenanceClient(databaseUrl, (client) =>
    client.$executeRawUnsafe(
      `CREATE DATABASE ${quoteIdentifier(getTemplateDatabaseName(runId))}`,
    ),
  );

  const templateDatabaseUrl = getTemplateDatabaseUrl(databaseUrl, runId);

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
 * Clones this worker's database from the template, if it does not already
 * exist.
 *
 * @param databaseUrl Maintenance database URL.
 * @param runId This run's id.
 */
export async function acquireWorkerDatabase(
  databaseUrl: string,
  runId: string,
): Promise<void> {
  const databaseName = getWorkerDatabaseName(runId);

  await withMaintenanceClient(databaseUrl, async (client) => {
    const existing = await client.$queryRaw<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${databaseName}
    `;
    if (existing.length > 0) return;

    for (let attempt = 1; ; attempt++) {
      try {
        await client.$executeRawUnsafe(
          `CREATE DATABASE ${quoteIdentifier(databaseName)} WITH TEMPLATE ${quoteIdentifier(getTemplateDatabaseName(runId))}`,
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
}
