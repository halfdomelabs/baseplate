// @ts-nocheck

import {
  getTemplateDatabaseUrl,
  getWorkerDatabaseName,
  TEMPLATE_DATABASE_NAME,
  TEST_DATABASE_NAME,
} from '$workerDatabaseTestHelper';
import { PrismaClient } from '%prismaGeneratedImports';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import path from 'node:path';

/**
 * Postgres rejects `CREATE DATABASE ... WITH TEMPLATE` while another session is
 * connected to the template, so concurrent workers can collide transiently.
 */
const CLONE_MAX_ATTEMPTS = 5;

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
 * @param databaseUrl Maintenance database URL.
 * @param options.keepTemplate Retain the template database.
 * @returns Names of the databases dropped.
 */
export async function dropStaleTestDatabases(
  databaseUrl: string,
  { keepTemplate = false }: { keepTemplate?: boolean } = {},
): Promise<string[]> {
  // The LIKE query is only a coarse prefilter (`_` is a LIKE wildcard); this
  // pattern is the authoritative allowlist of what we may DROP. TEST_DATABASE_NAME
  // is restricted to `[a-z0-9_]`, so it needs no escaping here.
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

  const templateDatabaseUrl = getTemplateDatabaseUrl(databaseUrl);

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
 */
export async function acquireWorkerDatabase(
  databaseUrl: string,
): Promise<void> {
  const databaseName = getWorkerDatabaseName();

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
}
