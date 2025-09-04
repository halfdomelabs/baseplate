#!/usr/bin/env node
/* eslint-disable import-x/no-extraneous-dependencies */

/**
 * A resilient, monorepo-aware code formatting hook script in TypeScript.
 *
 * This script is designed for hooks that require prettifying and linting a particular file e.g. for Claude code.
 * It finds the nearest `package.json` to determine the project root for a given file.
 *
 * For Prettier: It uses the Prettier Node API to format files. It first checks
 * if a file is supported by Prettier using `getFileInfo` to avoid unnecessary work.
 *
 * For ESLint: It shells out to run `eslint --fix` because its Node API is more complex.
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

// A cache for Prettier configurations to avoid repeated lookups for multiple files.
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
 * Formats a file using the Prettier Node API.
 * @param filePath The absolute path to the file to format.
 */
async function runPrettier(filePath: string): Promise<void> {
  console.info(`Checking Prettier for ${path.basename(filePath)}...`);
  try {
    const fileInfo = await getFileInfo(filePath);

    // Skip if file is ignored by .prettierignore or has no known parser
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

    if (content === formattedContent) {
      console.info(`✅ Prettier check passed (already formatted).`);
    } else {
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
 * Runs ESLint as a shell command to autofix a file.
 * @param filePath The full path to the file to process.
 * @param cwd The current working directory to run the command in.
 */
async function runEslint(filePath: string, cwd: string): Promise<void> {
  console.info(
    `Running ESLint on ${path.basename(filePath)} (in ${path.basename(cwd)})...`,
  );
  try {
    await execPromise(`npx eslint --fix "${filePath}"`, { cwd });
    console.info(`✅ ESLint completed successfully.`);
  } catch (error) {
    console.error(`❌ ESLint failed for ${filePath}.`);
    // ESLint outputs errors to stdout/stderr, which execPromise includes in the error message.
    console.error(error instanceof Error ? error.message : String(error));
  }
}

const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: Please provide a file path as an argument.');
  process.exit(1);
}

const absoluteFilePath = path.resolve(filePath);
const extension = path.extname(absoluteFilePath);

if (!VALID_EXTENSIONS.has(extension)) {
  console.info(
    `Skipping file (unsupported extension): ${path.basename(absoluteFilePath)}`,
  );
  process.exit(0);
}

const fileDir = path.dirname(absoluteFilePath);
const packageInfo = findNearestPackageJson(fileDir);

if (!packageInfo) {
  console.info(
    `No package.json found for ${absoluteFilePath}. Skipping formatters.`,
  );
  process.exit(0);
}

const { pkgPath, pkgDir } = packageInfo;
console.info(
  `Found package context for ${path.basename(absoluteFilePath)} at: ${pkgDir}`,
);

const pkgContent = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgContent) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

// Conditionally run formatters based on project dependencies
if (dependencies.eslint) {
  await runEslint(absoluteFilePath, pkgDir);
}
if (dependencies.prettier) {
  await runPrettier(absoluteFilePath);
}

console.info(`\nFormatting hook finished for ${absoluteFilePath}.`);
