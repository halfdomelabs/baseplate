import chalk from 'chalk';
import path from 'node:path';

import type { PackageInfo } from '../utils/workspace.js';

import { METAFILES } from '../config/index.js';
import {
  readJsonFile,
  readTextFile,
  showDiff,
  writeTextFile,
} from '../utils/file-operations.js';
import { formatContent, formatJson } from '../utils/formatter.js';
import { findWorkspacePackages } from '../utils/workspace.js';

export interface SyncOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  const rootDir = process.cwd();
  const packages = await findWorkspacePackages(rootDir);
  let changedCount = 0;

  console.info(chalk.bold('\nSynchronizing metafiles for all packages...\n'));

  for (const pkg of packages) {
    const changed = await syncPackage(pkg, options);
    if (changed) {
      changedCount++;
    }
  }

  if (options.dryRun) {
    console.info(
      chalk.yellow(
        `\n${changedCount} package(s) would be updated (dry run mode)\n`,
      ),
    );
  } else {
    console.info(chalk.green(`\n✓ Updated ${changedCount} package(s)\n`));
  }
}

async function syncPackage(
  pkg: PackageInfo,
  options: SyncOptions,
): Promise<boolean> {
  let hasChanges = false;

  console.info(chalk.blue(`\nProcessing ${pkg.name}...`));

  for (const metafile of METAFILES) {
    if (!metafile.shouldExist(pkg)) {
      continue;
    }

    const changed = await syncMetafile(pkg, metafile, options);
    if (changed) {
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    console.info(chalk.gray('  No changes needed'));
  }

  return hasChanges;
}

async function syncMetafile(
  pkg: PackageInfo,
  metafile: (typeof METAFILES)[0],
  options: SyncOptions,
): Promise<boolean> {
  const filePath = path.join(pkg.path, metafile.fileName);

  // Get expected content
  const expectedContent = metafile.getContent(pkg);
  let expectedString: string;

  if (typeof expectedContent === 'object') {
    // For JSON files, format with prettier
    expectedString = metafile.format
      ? await formatJson(expectedContent)
      : `${JSON.stringify(expectedContent, null, 2)}\n`;
  } else {
    expectedString = metafile.format
      ? await formatContent(expectedContent, filePath)
      : expectedContent;
  }

  // Get current content
  let currentString: string;

  if (metafile.fileName === 'package.json') {
    // Special handling for package.json - read and format current content
    const currentJson = readJsonFile(filePath);
    currentString = currentJson ? await formatJson(currentJson) : '';
  } else {
    const currentContent = readTextFile(filePath) ?? '';
    currentString =
      metafile.format && currentContent
        ? await formatContent(currentContent, filePath)
        : currentContent;
  }

  // Check if there are changes
  if (currentString.trim() === expectedString.trim()) {
    return false;
  }

  // Show diff if verbose or dry-run
  if (options.verbose || options.dryRun) {
    showDiff(metafile.fileName, currentString, expectedString);
  }

  // Write the file if not dry-run
  if (!options.dryRun) {
    if (metafile.fileName === 'package.json') {
      // Write JSON directly to preserve formatting
      writeTextFile(filePath, expectedString);
    } else {
      writeTextFile(filePath, expectedString);
    }
    console.info(chalk.green(`  ✓ Updated ${metafile.fileName}`));
  }

  return true;
}
