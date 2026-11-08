#!/usr/bin/env node

/**
 * Formatting and linting hook script: runs oxlint --fix then oxfmt on the given
 * files in one batch from the repo root.
 *
 * Flags such as `--no-eslint` are accepted and ignored for backwards compatibility
 * with existing hook configurations.
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFilePromise = promisify(execFile);

const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// oxfmt formats these in addition to the JS/TS extensions above.
const OXFMT_ONLY_EXTENSIONS = new Set([
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.css',
  '.scss',
  '.yaml',
  '.yml',
  '.html',
]);

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

async function runOxfmt(filePaths: string[]): Promise<void> {
  console.info(`Running oxfmt on ${filePaths.length} file(s)...`);
  try {
    await execFilePromise('npx', ['oxfmt', ...filePaths], { cwd: ROOT_DIR });
    console.info(`✅ oxfmt completed for ${filePaths.length} file(s).`);
  } catch (error) {
    console.error('❌ oxfmt failed.');
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function runOxlint(filePaths: string[]): Promise<void> {
  console.info(`Running oxlint on ${filePaths.length} file(s)...`);
  try {
    await execFilePromise('npx', ['oxlint', '--fix', ...filePaths], {
      cwd: ROOT_DIR,
    });
    console.info(`✅ oxlint completed for ${filePaths.length} file(s).`);
  } catch (error) {
    console.error('❌ oxlint failed.');
    console.error(error instanceof Error ? error.message : String(error));
  }
}

const inputPaths = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

if (inputPaths.length === 0) {
  console.error('Error: Please provide at least one file path as an argument.');
  process.exit(1);
}

const files = inputPaths
  .map((filePath) => path.resolve(filePath))
  .filter((filePath) => {
    const extension = path.extname(filePath);
    return (
      VALID_EXTENSIONS.has(extension) || OXFMT_ONLY_EXTENSIONS.has(extension)
    );
  });

if (files.length > 0) {
  console.info(`\nProcessing ${files.length} file(s) with oxlint + oxfmt...`);
  // oxlint only understands JS/TS, so it never sees the oxfmt-only extensions.
  const lintableFiles = files.filter((f) =>
    VALID_EXTENSIONS.has(path.extname(f)),
  );
  if (lintableFiles.length > 0) await runOxlint(lintableFiles);
  await runOxfmt(files);
}

console.info(`\nFormatting hook finished.`);
