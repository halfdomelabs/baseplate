#!/usr/bin/env node

/**
 * @file setup-baseplate-package.ts
 * @description
 * This script bootstraps a new package within the Baseplate ecosystem by publishing
 * a minimal placeholder to npm. This process is required to reserve the package
 * namespace under the @baseplate-dev scope and to enable OpenID Connect (OIDC)
 * Trusted Publishing.
 * * Trusted Publishing allows GitHub Actions to publish packages to npm without
 * persistent static tokens, leveraging short-lived OIDC tokens instead.
 */

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as readline from 'node:readline';
import { parseArgs } from 'node:util';

function checkNpmLogin(): void {
  try {
    execSync('npm whoami', { stdio: 'pipe', encoding: 'utf-8' });
  } catch {
    console.error(
      '\n❌ Not logged in to npm. Run `npm login` first, then run this script again.\n',
    );
    process.exit(1);
  }
}

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

const { values, positionals } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    access: { type: 'string', default: 'public' },
    yes: { type: 'boolean', short: 'y', default: false },
  },
  allowPositionals: true,
});

const packageName = positionals[0];

if (values.help || !packageName) {
  console.info(`
Usage: setup-baseplate-package <package-name> [options]
Example: setup-baseplate-package core-utils
(Automatically scopes to @baseplate-dev/)

Options:
  -y, --yes    Skip confirmation prompt
  `);
  process.exit(packageName ? 0 : 1);
}

checkNpmLogin();

// Ensure the package name starts with the correct org scope
const fullPackageName = packageName.startsWith('@')
  ? packageName
  : `@baseplate-dev/${packageName}`;

if (!values.yes) {
  const ok = await confirm(`Publish ${fullPackageName} to npm?`);
  if (!ok) {
    console.info('Aborted.');
    process.exit(0);
  }
}

const tempDir = path.join(
  tmpdir(),
  `bp-setup-${randomBytes(4).toString('hex')}`,
);
await mkdir(tempDir, { recursive: true });

try {
  const packageJson = {
    name: fullPackageName,
    version: '0.0.1',
    description: `Baseplate ecosystem package: ${fullPackageName}`,
    repository: {
      type: 'git',
      url: 'git+https://github.com/halfdomelabs/baseplate.git',
    },
    publishConfig: {
      access: values.access,
    },
  };

  await writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );
  await writeFile(
    path.join(tempDir, 'README.md'),
    `# ${fullPackageName}\n\nPlaceholder for Baseplate ecosystem package.`,
  );

  console.info(`📤 Publishing ${fullPackageName} to npm...`);

  // Execute publish
  execSync(`npm publish --access ${values.access}`, {
    cwd: tempDir,
    stdio: 'inherit',
  });

  console.info(`
✅ Successfully bootstrapped ${fullPackageName}

Next Steps (OIDC Configuration):
--------------------------------------------------
1. Visit: https://www.npmjs.com/package/${fullPackageName}/access
2. Click "Add GitHub Actions" as a Trusted Publisher.
3. Use the following configuration:
   - Organization: halfdomelabs
   - Repository:   baseplate
   - Workflow:     release.yml
   - Environment:  release
--------------------------------------------------
  `);
} catch (error) {
  console.error(
    `\n❌ Error during setup: ${error instanceof Error ? error.message : 'Unknown error'}`,
  );
  process.exit(1);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
