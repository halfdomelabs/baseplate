#!/usr/bin/env node

/**
 * Debug helper script for running Vitest in the correct package context
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Get the relative file path from the command line arguments
const relativePath = process.argv[2];

if (!relativePath) {
  console.error('Please provide a file path as an argument');
  process.exit(1);
}

// Resolve the absolute path
const workspaceRoot = process.cwd();
const absolutePath = path.resolve(workspaceRoot, relativePath);

// Find the package containing this file
function findPackageRoot(filePath) {
  let currentDir = path.dirname(filePath);

  // Walk up the directory tree until we find a package.json
  while (
    currentDir !== workspaceRoot &&
    currentDir !== path.dirname(currentDir)
  ) {
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  // If we couldn't find a package.json, fall back to the workspace root
  return workspaceRoot;
}

const packageRoot = findPackageRoot(absolutePath);
console.log(`Found package root: ${packageRoot}`);

// Try to find the test file with *.test.ts or *.unit.test.ts or *.int.test.ts
let absoluteTestPath = '';

if (absolutePath.endsWith('.test.ts') || absolutePath.endsWith('.test.tsx')) {
  absoluteTestPath = absolutePath;
} else {
  const testBase = absolutePath.replace(/\.(t|j)sx?$/, '');
  const possibleTestFiles = [
    `${testBase}.test.ts`,
    `${testBase}.unit.test.ts`,
    `${testBase}.int.test.ts`,
    `${testBase}.test.tsx`,
    `${testBase}.unit.test.tsx`,
    `${testBase}.int.test.tsx`,
  ];

  for (const possibleTestFile of possibleTestFiles) {
    if (fs.existsSync(possibleTestFile)) {
      absoluteTestPath = possibleTestFile;
      break;
    }
  }
}

if (!absoluteTestPath) {
  console.error(`Could not find a test file for ${absolutePath}`);
  process.exit(1);
}

// Get the file path relative to the package directory
const fileRelativeToPackage = path.relative(packageRoot, absoluteTestPath);
console.log(`Running test: ${fileRelativeToPackage}`);

// Find the vitest executable in this package or in the tools package
let vitestPath;

// First try to find vitest in the specific package
const packageVitestPath = path.join(
  packageRoot,
  'node_modules',
  'vitest',
  'vitest.mjs',
);
// Then try to find it in the tools package
const toolsVitestPath = path.join(
  workspaceRoot,
  'packages',
  'tools',
  'node_modules',
  'vitest',
  'vitest.mjs',
);

if (fs.existsSync(packageVitestPath)) {
  vitestPath = packageVitestPath;
} else if (fs.existsSync(toolsVitestPath)) {
  vitestPath = toolsVitestPath;
} else {
  console.error('Could not find vitest executable');
  process.exit(1);
}

console.log(`Using vitest at: ${vitestPath}`);

// Run vitest with the package directory as cwd
const vitestProcess = spawn(
  'node',
  [vitestPath, 'run', fileRelativeToPackage],
  {
    cwd: packageRoot,
    stdio: 'inherit', // Pipe the output directly to our process
    env: { ...process.env, FORCE_COLOR: true }, // Ensure colors are displayed
  },
);

vitestProcess.on('error', (err) => {
  console.error(`Failed to start vitest: ${err}`);
  process.exit(1);
});

vitestProcess.on('close', (code) => {
  process.exit(code);
});
