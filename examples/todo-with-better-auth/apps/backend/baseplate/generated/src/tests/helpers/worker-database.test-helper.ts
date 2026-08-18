import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Base name every test database derives from. */
export const TEST_DATABASE_NAME =
  /* TPL_TEST_DB:START */ 'todo_with_better_auth_backend_test'; /* TPL_TEST_DB:END */

/** Database cloned by each worker; never connected to by tests directly. */
export const TEMPLATE_DATABASE_NAME = `${TEST_DATABASE_NAME}_template`;

/**
 * Holds one marker file per worker slot that has cloned its database.
 *
 * Vitest gives each test file a fresh module registry, so an in-process flag
 * would not survive across the files a worker slot runs.
 */
const WORKER_MARKER_DIRECTORY = path.join(
  tmpdir(),
  `${TEST_DATABASE_NAME}_workers`,
);

/**
 * Returns the 1-based Vitest worker slot for the current process.
 *
 * `VITEST_POOL_ID` is bounded by `maxWorkers`, unlike `VITEST_WORKER_ID` which
 * increments per test file. Falls back to 1 outside a worker.
 */
function getTestWorkerId(): number {
  const poolId = Number(process.env.VITEST_POOL_ID ?? '1');
  return Number.isInteger(poolId) && poolId > 0 ? poolId : 1;
}

/**
 * Replaces the database name in a Postgres connection string, preserving
 * credentials, port and query parameters such as `?schema=public`.
 *
 * @param connectionString Source connection string.
 * @param database Database name to switch to.
 * @returns The rewritten connection string.
 */
function replaceDatabase(connectionString: string, database: string): string {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
}

/** Returns this worker slot's database name. */
export function getWorkerDatabaseName(): string {
  return `${TEST_DATABASE_NAME}_${getTestWorkerId()}`;
}

/**
 * Returns the template database's URL.
 *
 * @param maintenanceDatabaseUrl Maintenance database URL to rewrite.
 * @returns The template database's connection string.
 */
export function getTemplateDatabaseUrl(maintenanceDatabaseUrl: string): string {
  return replaceDatabase(maintenanceDatabaseUrl, TEMPLATE_DATABASE_NAME);
}

/**
 * Returns this worker's database URL.
 *
 * @param maintenanceDatabaseUrl Maintenance database URL to rewrite.
 * @returns This worker's connection string.
 */
export function getWorkerDatabaseUrl(maintenanceDatabaseUrl: string): string {
  return replaceDatabase(maintenanceDatabaseUrl, getWorkerDatabaseName());
}

/**
 * Runs `clone` unless this worker slot has already cloned its database.
 *
 * The marker is written only once `clone` resolves, so a failed clone is
 * retried by the next test file.
 *
 * @param clone Clones this worker's database from the template.
 */
export async function ensureWorkerDatabase(
  clone: () => Promise<void>,
): Promise<void> {
  const markerPath = path.join(WORKER_MARKER_DIRECTORY, `${getTestWorkerId()}`);
  if (existsSync(markerPath)) return;

  await clone();

  mkdirSync(WORKER_MARKER_DIRECTORY, { recursive: true });
  writeFileSync(markerPath, '');
}

/** Forgets every recorded worker database. */
export function clearWorkerDatabaseRecords(): void {
  rmSync(WORKER_MARKER_DIRECTORY, { force: true, recursive: true });
}
