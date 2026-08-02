#!/usr/bin/env node
/* eslint-disable import-x/no-extraneous-dependencies */

/**
 * Detects dependencies Baseplate declares in generated example apps that
 * nothing in the generated code imports.
 *
 * This lives in the monorepo rather than inside each example because the
 * generator owns the examples' `package.json` — tooling added there is wiped by
 * the next `sync-examples`. The fix for a finding is likewise always a
 * generator change, never an edit to the example.
 *
 * Usage:
 *   pnpm check:example-deps                   # verify every example
 *   pnpm check:example-deps --write           # re-record the snapshot
 *   pnpm check:example-deps --example <name>  # verify one example (CI matrix)
 */

import type { Results } from 'knip/session';

import { createOptions } from 'knip/session';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// knip's `types` entry only declares config types, so `main` — its documented
// programmatic entry point — has no published signature. `createSession` is the
// typed alternative but is watch-mode only and throws outside a watch run.
const { main } = (await import('knip')) as unknown as {
  main: (
    options: Awaited<ReturnType<typeof createOptions>>,
  ) => Promise<Results>;
};

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const EXAMPLES_DIR = path.join(REPO_ROOT, 'examples');
const KNIP_CONFIG_PATH = path.join(
  REPO_ROOT,
  'scripts/knip-examples.config.js',
);
const SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  'scripts/example-dependencies-snapshot.json',
);

/**
 * Lists the example projects to scan.
 *
 * Discovered from disk rather than hardcoded so a newly added example is
 * covered without editing this script.
 *
 * @returns Directory names under `examples/`, sorted.
 */
async function listExamples(): Promise<string[]> {
  const entries = await readdir(EXAMPLES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Runs knip against one example and returns its surplus dependencies.
 *
 * Line and column are deliberately dropped: they shift whenever an unrelated
 * dependency is added, which would churn the snapshot without changing meaning.
 *
 * @param example Directory name under `examples/`.
 * @returns `<example>/<workspace> <dependency>` entries.
 */
async function findUnusedDependencies(example: string): Promise<string[]> {
  const options = await createOptions({
    cwd: path.join(EXAMPLES_DIR, example),
    // knip reads `config` from parsed CLI args; passing it as a top-level
    // option is silently ignored and the config would not be applied.
    args: { config: KNIP_CONFIG_PATH, dependencies: true },
    isShowProgress: false,
  });

  const { issues } = await main(options);

  return [issues.dependencies, issues.devDependencies].flatMap((group) =>
    Object.entries(group).flatMap(([file, found]) =>
      Object.keys(found).map(
        (name) => `${example}/${path.dirname(file)} ${name}`,
      ),
    ),
  );
}

/**
 * Verifies (or re-records) the unused-dependency snapshot.
 *
 * @throws If arguments are invalid or the snapshot no longer matches.
 */
async function checkExampleDependencies(): Promise<void> {
  const args = process.argv.slice(2);
  const exampleIndex = args.indexOf('--example');
  const only = exampleIndex === -1 ? undefined : args[exampleIndex + 1];
  const isWrite = args.includes('--write');

  if (exampleIndex !== -1 && !only) {
    throw new Error('--example requires an example name.');
  }
  if (only && isWrite) {
    throw new Error('--write records every example; it cannot be scoped.');
  }

  const examples = await listExamples();
  if (only && !examples.includes(only)) {
    throw new Error(
      `Unknown example "${only}". Available: ${examples.join(', ')}`,
    );
  }

  const scanned = only ? [only] : examples;
  const perExample = await Promise.all(
    scanned.map((example) => findUnusedDependencies(example)),
  );
  const found = perExample
    .flat()
    .toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  if (isWrite) {
    await writeFile(SNAPSHOT_PATH, `${JSON.stringify(found, null, 2)}\n`);
    console.info(`Recorded ${found.length} unused example dependencies.`);
    return;
  }

  const snapshot = JSON.parse(
    await readFile(SNAPSHOT_PATH, 'utf8'),
  ) as string[];
  // When scoped to one example, only that example's entries are comparable.
  const expected = only
    ? snapshot.filter((entry) => entry.startsWith(`${only}/`))
    : snapshot;

  const added = found.filter((entry) => !expected.includes(entry));
  const removed = expected.filter((entry) => !found.includes(entry));

  if (added.length === 0 && removed.length === 0) {
    console.info(`Example dependencies match snapshot (${found.length}).`);
    return;
  }

  const changes = [
    ...added.map((entry) => `  + ${entry}`),
    ...removed.map((entry) => `  - ${entry}`),
  ].join('\n');

  throw new Error(
    `Example dependencies changed.\n${changes}\n\n` +
      'A new entry means a generator declares a dependency nothing imports;\n' +
      'remove it from the generator rather than from the example.\n' +
      'If the change is intentional, re-record with: pnpm check:example-deps --write',
  );
}

await checkExampleDependencies().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
