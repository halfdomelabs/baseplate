#!/usr/bin/env node
/* eslint-disable import-x/no-extraneous-dependencies */

/**
 * A monorepo-aware formatting and linting hook script.
 *
 * Two code paths:
 * - Monorepo files (packages/*, plugins/*, etc.): runs oxlint --fix then oxfmt on all
 *   files in one batch from the repo root.
 * - Example project files (examples/*): uses per-project grouping with prettier + eslint
 *   since examples are standalone monorepos with their own tooling.
 *
 * Required root dependencies: typescript, ts-node, oxfmt, oxlint, prettier, @types/node, @types/prettier
 */

import type { Options } from 'prettier';

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  format,
  getFileInfo,
  resolveConfig,
  resolveConfigFile,
} from 'prettier';

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

// --- Prettier (for examples) ---

const prettierConfigCache = new Map<string, Options | null>();

async function getPrettierConfig(filePath: string): Promise<Options | null> {
  const configFile = await resolveConfigFile(filePath);
  if (!configFile) return null;
  if (prettierConfigCache.has(configFile)) {
    return prettierConfigCache.get(configFile) ?? null;
  }
  const config = await resolveConfig(filePath, { config: configFile });
  prettierConfigCache.set(configFile, config);
  return config;
}

async function runPrettier(filePath: string): Promise<void> {
  try {
    const fileInfo = await getFileInfo(filePath);
    if (fileInfo.ignored || !fileInfo.inferredParser) return;
    const config = await getPrettierConfig(filePath);
    if (!config) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const formattedContent = await format(content, {
      ...config,
      filepath: filePath,
    });
    if (content !== formattedContent) {
      fs.writeFileSync(filePath, formattedContent);
      console.info(`✅ Prettier formatted ${path.basename(filePath)}.`);
    }
  } catch (error) {
    console.error(`❌ Prettier failed for ${filePath}.`);
    if (error instanceof Error) console.error(error.message);
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

// --- oxfmt + oxlint (for monorepo) ---

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

// --- Main ---

const inputPaths = process.argv.slice(2);

if (inputPaths.length === 0) {
  console.error('Error: Please provide at least one file path as an argument.');
  process.exit(1);
}

const examplesDir = path.join(ROOT_DIR, 'examples');

const monorepoFiles: string[] = [];
const exampleFiles: string[] = [];

for (const filePath of inputPaths) {
  const absoluteFilePath = path.resolve(filePath);
  if (!VALID_EXTENSIONS.has(path.extname(absoluteFilePath))) continue;
  if (absoluteFilePath.startsWith(examplesDir + path.sep)) {
    exampleFiles.push(absoluteFilePath);
  } else {
    monorepoFiles.push(absoluteFilePath);
  }
}

// Process monorepo files: run oxlint then oxfmt from root.
if (monorepoFiles.length > 0) {
  console.info(
    `\nProcessing ${monorepoFiles.length} monorepo file(s) with oxlint + oxfmt...`,
  );
  await runOxlint(monorepoFiles);
  await runOxfmt(monorepoFiles);
}

// Process example files: per-project grouping with prettier + eslint.
if (exampleFiles.length > 0) {
  console.info(`\nProcessing ${exampleFiles.length} example file(s)...`);

  const filesByProject = new Map<
    string,
    { pkgPath: string; files: string[] }
  >();
  for (const filePath of exampleFiles) {
    const packageInfo = findNearestPackageJson(path.dirname(filePath));
    if (!packageInfo) {
      console.info(`No package.json found for ${filePath}. Skipping.`);
      continue;
    }
    const { pkgDir, pkgPath } = packageInfo;
    if (!filesByProject.has(pkgDir)) {
      filesByProject.set(pkgDir, { pkgPath, files: [] });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    filesByProject.get(pkgDir)!.files.push(filePath);
  }

  for (const [pkgDir, { pkgPath, files }] of filesByProject.entries()) {
    console.info(
      `Processing ${files.length} file(s) in example project: ${pkgDir}`,
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.eslint) await runEslint(files, pkgDir);

    if (deps.prettier) {
      await Promise.all(files.map((f) => runPrettier(f)));
    }
  }
}

console.info(`\nFormatting hook finished.`);
