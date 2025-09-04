#!/usr/bin/env node
/* eslint-disable import-x/no-extraneous-dependencies */

/**
 * A resilient, monorepo-aware code formatting hook script in TypeScript.
 *
 * This script is designed for hooks that require prettifying and linting multiple files at once.
 * It groups files by their nearest `package.json` to determine the project root for each file group.
 *
 * For Prettier: It uses the Prettier Node API to format files concurrently. It first checks
 * if a file is supported by Prettier using `getFileInfo` to avoid unnecessary work.
 *
 * For ESLint: It shells out to run `eslint --fix` on all files for a given project in a single,
 * batched command for better performance.
 *
 * The script runs a tool only if it's found as a dependency in the relevant `package.json`.
 * It's resilient and will report errors from formatters without crashing the hook.
 *
 * Required dependencies:
 * - typescript
 * - ts-node
 * - prettier
 * - eslint
 * - @types/node
 * - @types/prettier
 */

import type { Options } from 'prettier';

import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  format,
  getFileInfo,
  resolveConfig,
  resolveConfigFile,
} from 'prettier';

const execPromise = promisify(exec);

const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// A cache for Prettier configurations to avoid repeated lookups.
const prettierConfigCache = new Map<string, Options | null>();

/**
 * Finds the nearest package.json file by traversing up from a starting directory.
 * @param startDir The directory to start searching from.
 * @returns An object with the path and directory of the package.json, or null if not found.
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
      // Reached the root of the file system
      return null;
    }
    currentDir = parentDir;
  }
}

/**
 * Resolves and caches the Prettier configuration for a given file path.
 * @param filePath The path of the file to resolve config for.
 * @returns The resolved Prettier options, or null if no config is found.
 */
async function getPrettierConfig(filePath: string): Promise<Options | null> {
  const configFile = await resolveConfigFile(filePath);
  if (!configFile) {
    return null; // No config file found
  }

  // Return from cache if available
  if (prettierConfigCache.has(configFile)) {
    return prettierConfigCache.get(configFile) ?? null;
  }

  const config = await resolveConfig(filePath, { config: configFile });
  prettierConfigCache.set(configFile, config);
  return config;
}

/**
 * Formats a single file using the Prettier Node API.
 * @param filePath The absolute path to the file to format.
 */
async function runPrettier(filePath: string): Promise<void> {
  console.info(`Checking Prettier for ${path.basename(filePath)}...`);
  try {
    const fileInfo = await getFileInfo(filePath);

    if (fileInfo.ignored || !fileInfo.inferredParser) {
      console.info(
        `Prettier is skipping ${path.basename(filePath)} (ignored or unsupported).`,
      );
      return;
    }

    const config = await getPrettierConfig(filePath);
    if (!config) {
      console.info(
        `No Prettier config found for ${path.basename(filePath)}. Skipping.`,
      );
      return;
    }

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
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

/**
 * Runs ESLint as a shell command to autofix a batch of files.
 * @param filePaths An array of full paths to the files to process.
 * @param cwd The current working directory to run the command in.
 */
async function runEslint(filePaths: string[], cwd: string): Promise<void> {
  console.info(
    `Running ESLint on ${filePaths.length} file(s) in ${path.basename(cwd)}...`,
  );
  try {
    const filesToLint = filePaths.map((f) => `"${f}"`).join(' ');
    await execPromise(`npx eslint --fix ${filesToLint}`, { cwd });
    console.info(
      `✅ ESLint completed successfully for ${filePaths.length} file(s).`,
    );
  } catch (error) {
    console.error(`❌ ESLint failed for files in ${cwd}.`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
  console.error('Error: Please provide at least one file path as an argument.');
  process.exit(1);
}

// Group files by their project directory (pkgDir) to process them in batches.
const filesByProject = new Map<string, { pkgPath: string; files: string[] }>();

for (const filePath of filePaths) {
  const absoluteFilePath = path.resolve(filePath);
  const extension = path.extname(absoluteFilePath);

  if (!VALID_EXTENSIONS.has(extension)) {
    console.info(
      `Skipping file (unsupported extension): ${path.basename(absoluteFilePath)}`,
    );
    continue;
  }

  const packageInfo = findNearestPackageJson(path.dirname(absoluteFilePath));
  if (!packageInfo) {
    console.info(
      `No package.json found for ${absoluteFilePath}. Skipping formatters.`,
    );
    continue;
  }

  const { pkgDir, pkgPath } = packageInfo;
  if (!filesByProject.has(pkgDir)) {
    filesByProject.set(pkgDir, { pkgPath, files: [] });
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  filesByProject.get(pkgDir)!.files.push(absoluteFilePath);
}

// Process each project's files.
for (const [pkgDir, { pkgPath, files }] of filesByProject.entries()) {
  console.info(`\nProcessing ${files.length} file(s) in project: ${pkgDir}`);

  const pkgContent = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgContent) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

  const tasks: Promise<void>[] = [];

  // Run ESLint in one batch command for all files in this project.
  if (dependencies.eslint) {
    await runEslint(files, pkgDir);
  }

  // Run Prettier concurrently on each file.
  if (dependencies.prettier) {
    for (const file of files) {
      // eslint-disable-next-line unicorn/prefer-top-level-await
      tasks.push(runPrettier(file));
    }
  }

  await Promise.all(tasks);
}

console.info(`\nFormatting hook finished for all provided files.`);
