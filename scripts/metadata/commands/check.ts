import chalk from 'chalk';
import path from 'node:path';

import type { PackageInfo } from '../utils/workspace.js';

import { METAFILES } from '../config/index.js';
import { readJsonFile, readTextFile } from '../utils/file-operations.js';
import { formatContent, formatJson } from '../utils/formatter.js';
import { findWorkspacePackages } from '../utils/workspace.js';

interface CheckResult {
  package: PackageInfo;
  issues: string[];
}

export async function checkCommand(): Promise<void> {
  const rootDir = process.cwd();
  const packages = await findWorkspacePackages(rootDir);
  const results: CheckResult[] = [];

  console.info(chalk.bold('\nChecking metafiles for all packages...\n'));

  for (const pkg of packages) {
    const issues = await checkPackage(pkg);
    if (issues.length > 0) {
      results.push({ package: pkg, issues });
    }
  }

  // Report results
  if (results.length === 0) {
    console.info(chalk.green('✓ All packages have correct metafiles'));
    return;
  } else {
    console.info(
      chalk.red(`\nFound issues in ${results.length} package(s):\n`),
    );

    for (const result of results) {
      console.info(
        chalk.yellow(`${result.package.name} (${result.package.path}):`),
      );
      for (const issue of result.issues) {
        console.info(`  - ${issue}`);
      }
      console.info();
    }

    console.info(
      chalk.yellow('Run with "pnpm metadata sync" to fix these issues\n'),
    );

    throw new Error('Found issues in packages');
  }
}

async function checkPackage(pkg: PackageInfo): Promise<string[]> {
  const issues: string[] = [];

  for (const metafile of METAFILES) {
    const filePath = path.join(pkg.path, metafile.fileName);

    if (!metafile.shouldExist(pkg)) {
      continue;
    }

    // Get expected content
    const expectedContent = metafile.getContent(pkg);
    let expectedString: string;

    if (typeof expectedContent === 'object') {
      // For JSON files, format with prettier
      expectedString = metafile.format
        ? await formatJson(expectedContent)
        : JSON.stringify(expectedContent, null, 2);
    } else {
      expectedString = metafile.format
        ? await formatContent(expectedContent, filePath)
        : expectedContent;
    }

    // Get actual content
    let actualContent: string | undefined;

    if (metafile.fileName === 'package.json') {
      // Special handling for package.json
      const actualJson = readJsonFile(filePath);
      if (!actualJson) {
        issues.push(`Missing ${metafile.fileName}`);
        continue;
      }
      actualContent = await formatJson(actualJson);
    } else {
      actualContent = readTextFile(filePath);
      if (!actualContent) {
        issues.push(`Missing ${metafile.fileName}`);
        continue;
      }
      if (metafile.format) {
        actualContent = await formatContent(actualContent, filePath);
      }
    }

    // Compare content
    if (actualContent.trim() !== expectedString.trim()) {
      // Use custom check function if provided
      if (metafile.check) {
        const customIssues = metafile.check(pkg, actualContent, expectedString);
        issues.push(...customIssues);
      } else {
        issues.push(`Incorrect content in ${metafile.fileName}`);
      }
    }
  }

  return issues;
}
