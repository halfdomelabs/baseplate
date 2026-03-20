#!/usr/bin/env node

/**
 * A monorepo-aware formatting and linting hook script.
 *
 * Groups all input files by their nearest package.json, then for each group:
 * - Runs oxlint --fix (batch)
 * - Runs prettier --write (batch)
 * - Runs ESLint --fix for example projects only (they have their own tooling)
 *
 * Required root dependencies: typescript, ts-node, oxlint, prettier, @types/node
 */

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFilePromise = promisify(execFile);

const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

/**
 * Finds the nearest package.json file by traversing up from a starting directory.
 */
function findNearestPackageJson(
  startDir: string,
): { pkgPath: string; pkgDir: string } | null {
  let currentDir = startDir;
  while (true) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      return { pkgPath, pkgDir: currentDir };
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

// --- Tool runners ---

async function runPrettier(filePaths: string[], cwd: string): Promise<void> {
  console.info(
    `Running prettier on ${filePaths.length} file(s) in ${path.basename(cwd)}...`,
  );
  try {
    await execFilePromise(
      'npx',
      ['prettier', '--write', '--ignore-unknown', ...filePaths],
      { cwd },
    );
    console.info(`✅ prettier completed for ${filePaths.length} file(s).`);
  } catch (error) {
    console.error(`❌ prettier failed for files in ${cwd}.`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function runOxlint(filePaths: string[], cwd: string): Promise<void> {
  console.info(
    `Running oxlint on ${filePaths.length} file(s) in ${path.basename(cwd)}...`,
  );
  try {
    await execFilePromise('npx', ['oxlint', '--fix', ...filePaths], { cwd });
    console.info(`✅ oxlint completed for ${filePaths.length} file(s).`);
  } catch (error) {
    console.error(`❌ oxlint failed for files in ${cwd}.`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function runEslint(filePaths: string[], cwd: string): Promise<void> {
  console.info(
    `Running ESLint on ${filePaths.length} file(s) in ${path.basename(cwd)}...`,
  );
  try {
    await execFilePromise('npx', ['eslint', '--fix', ...filePaths], {
      cwd,
      env: { ...process.env, BASEPLATE_KEEP_UNUSED_IMPORTS: 'true' },
    });
    console.info(`✅ ESLint completed for ${filePaths.length} file(s).`);
  } catch (error) {
    console.error(`❌ ESLint failed for files in ${cwd}.`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

// --- Main ---

const skipEslint = process.argv.includes('--no-eslint');
const inputPaths = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

if (inputPaths.length === 0) {
  console.error('Error: Please provide at least one file path as an argument.');
  process.exit(1);
}

const examplesDir = path.join(ROOT_DIR, 'examples');

// Group all files by nearest package.json
const filesByProject = new Map<
  string,
  { pkgPath: string; files: string[]; isExample: boolean }
>();

for (const filePath of inputPaths) {
  const absoluteFilePath = path.resolve(filePath);
  if (!VALID_EXTENSIONS.has(path.extname(absoluteFilePath))) continue;

  const packageInfo = findNearestPackageJson(path.dirname(absoluteFilePath));
  if (!packageInfo) {
    console.info(`No package.json found for ${absoluteFilePath}. Skipping.`);
    continue;
  }

  const { pkgDir, pkgPath } = packageInfo;
  if (!filesByProject.has(pkgDir)) {
    const isExample = absoluteFilePath.startsWith(examplesDir + path.sep);
    filesByProject.set(pkgDir, { pkgPath, files: [], isExample });
  }
  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
  filesByProject.get(pkgDir)!.files.push(absoluteFilePath);
}

// Process each project group
for (const [
  pkgDir,
  { pkgPath, files, isExample },
] of filesByProject.entries()) {
  console.info(
    `\nProcessing ${files.length} file(s) in ${isExample ? 'example' : 'monorepo'} project: ${path.basename(pkgDir)}`,
  );

  if (isExample) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.eslint && !skipEslint) await runEslint(files, pkgDir);
    if (deps.prettier) await runPrettier(files, pkgDir);
  } else {
    await runOxlint(files, pkgDir);
    await runPrettier(files, pkgDir);
  }
}

console.info(`\nFormatting hook finished.`);
