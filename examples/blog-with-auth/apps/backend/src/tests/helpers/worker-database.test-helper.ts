import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Base name every test database derives from. */
export const TEST_DATABASE_NAME =
  /* TPL_TEST_DB:START */ 'blog_with_auth_backend_test'; /* TPL_TEST_DB:END */

/** Characters appended to the timestamp half of a run id. */
const RUN_ID_RANDOM_LENGTH = 4;

/**
 * Resolution of a run id's timestamp half.
 *
 * Reclamation works in hours and the whole name has 63 bytes to fit in, so
 * minutes buy three characters over milliseconds at no cost.
 */
const RUN_ID_TIMESTAMP_UNIT_MS = 60_000;

/** Alphabet the random half is drawn from, keeping a run id within `[a-z0-9]`. */
const RUN_ID_RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Matches this project's run-scoped test databases, capturing the run id.
 *
 * `TEST_DATABASE_NAME` is restricted to `[a-z0-9_]` by the generator, so it
 * needs no escaping here.
 */
const TEST_DATABASE_PATTERN = new RegExp(
  String.raw`^${TEST_DATABASE_NAME}_([a-z0-9]+)_(?:tpl|\d+)$`,
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

/**
 * Mints the id namespacing every database and marker belonging to one test run.
 *
 * The creation time is carried in the id because Postgres exposes no reliable
 * per-database creation timestamp, and age is what lets a later run reclaim
 * this one's databases after a crash.
 *
 * @returns A base-36 minute timestamp followed by the random characters that
 * separate runs started within the same minute.
 */
export function createTestRunId(): string {
  const random = [...randomBytes(RUN_ID_RANDOM_LENGTH)]
    .map((byte) => RUN_ID_RANDOM_ALPHABET[byte % RUN_ID_RANDOM_ALPHABET.length])
    .join('');
  const minutes = Math.floor(Date.now() / RUN_ID_TIMESTAMP_UNIT_MS);
  return `${minutes.toString(36)}${random}`;
}

/**
 * Reads the owning run and creation time out of a test database's name.
 *
 * @param databaseName Database name to inspect.
 * @returns The run id and its creation time in milliseconds since the epoch, or
 * undefined if the name is not one of ours.
 */
export function parseTestDatabaseName(
  databaseName: string,
): { runId: string; createdAt: number } | undefined {
  const runId = TEST_DATABASE_PATTERN.exec(databaseName)?.[1];
  if (runId === undefined) return undefined;

  // Only the random half is fixed-width, so the timestamp half may grow a
  // character without breaking this parse.
  const minutes = Number.parseInt(runId.slice(0, -RUN_ID_RANDOM_LENGTH), 36);
  if (Number.isNaN(minutes)) return undefined;

  return { runId, createdAt: minutes * RUN_ID_TIMESTAMP_UNIT_MS };
}

/**
 * Returns the name of the database each worker in this run clones from.
 *
 * @param runId This run's id.
 * @returns The template database's name.
 */
export function getTemplateDatabaseName(runId: string): string {
  return `${TEST_DATABASE_NAME}_${runId}_tpl`;
}

/**
 * Returns this worker slot's database name.
 *
 * @param runId This run's id.
 * @returns This worker's database name.
 */
export function getWorkerDatabaseName(runId: string): string {
  return `${TEST_DATABASE_NAME}_${runId}_${getTestWorkerId()}`;
}

/**
 * Returns the template database's URL.
 *
 * @param maintenanceDatabaseUrl Maintenance database URL to rewrite.
 * @param runId This run's id.
 * @returns The template database's connection string.
 */
export function getTemplateDatabaseUrl(
  maintenanceDatabaseUrl: string,
  runId: string,
): string {
  return replaceDatabase(
    maintenanceDatabaseUrl,
    getTemplateDatabaseName(runId),
  );
}

/**
 * Returns this worker's database URL.
 *
 * @param maintenanceDatabaseUrl Maintenance database URL to rewrite.
 * @param runId This run's id.
 * @returns This worker's connection string.
 */
export function getWorkerDatabaseUrl(
  maintenanceDatabaseUrl: string,
  runId: string,
): string {
  return replaceDatabase(maintenanceDatabaseUrl, getWorkerDatabaseName(runId));
}

/**
 * Creates the directory holding one marker file per worker slot that has cloned
 * its database.
 *
 * Vitest gives each test file a fresh module registry, so an in-process flag
 * would not survive across the files a worker slot runs. The directory belongs
 * to a single run, so no run ever reads another's markers.
 *
 * @param runId This run's id.
 * @returns The directory's path, to be passed to workers.
 */
export function createWorkerMarkerDirectory(runId: string): string {
  return mkdtempSync(path.join(tmpdir(), `${TEST_DATABASE_NAME}_${runId}_`));
}

/**
 * Removes a directory created by `createWorkerMarkerDirectory`.
 *
 * @param markerDirectory Directory to remove.
 */
export function removeWorkerMarkerDirectory(markerDirectory: string): void {
  rmSync(markerDirectory, { force: true, recursive: true });
}

/**
 * Runs `clone` unless this worker slot has already cloned its database.
 *
 * The marker is written only once `clone` resolves, so a failed clone is
 * retried by the next test file.
 *
 * @param markerDirectory This run's marker directory.
 * @param clone Clones this worker's database from the template.
 */
export async function ensureWorkerDatabase(
  markerDirectory: string,
  clone: () => Promise<void>,
): Promise<void> {
  const markerPath = path.join(markerDirectory, `${getTestWorkerId()}`);
  if (existsSync(markerPath)) return;

  await clone();

  writeFileSync(markerPath, '');
}
