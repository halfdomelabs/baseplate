/* eslint-disable no-console */
import { ExitPromptError } from '@inquirer/prompts';
import chalk from 'chalk';
import { program } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getNpmTokenAndVersion } from './npm.service.js';
import { generateBaseplateProject } from './project-creator.js';
import { getPackageVersion } from './version.js';

// check if directory contains a package.json file
async function checkForPackageJson(directory: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(directory, 'package.json');
    await fs.access(packageJsonPath);
    return true;
  } catch (error) {
    return false;
  }
}

async function runMain(): Promise<void> {
  const version = await getPackageVersion();

  if (!version) {
    throw new Error('Could not determine package version');
  }

  program
    .description('Create a new Baseplate project')
    .version(version ?? 'unknown')
    .argument('[directory]', 'The directory to initialize the project in', '.');

  program.parse(process.argv);

  const directory = program.processedArgs[0] as string;

  const resolvedDirectory = path.resolve(directory);

  const packageName = path
    .basename(resolvedDirectory)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  if (packageName === '-' || !packageName) {
    throw new Error(
      'Directory must have at least one Latin alphanumeric character.',
    );
  }

  const relativeDirectory = path.relative(process.cwd(), resolvedDirectory);

  console.log(`Creating a new Baseplate project (${packageName})...`);
  console.log(`Directory: ${relativeDirectory || '.'}`);
  console.log();

  const hasPackageJson = await checkForPackageJson(resolvedDirectory);

  if (hasPackageJson) {
    throw new Error(
      `The directory ${directory} already contains a package.json file.`,
    );
  }

  console.log(
    chalk.yellow(
      'Please enter your NPM token for Baseplate. While Baseplate is in private beta, an NPM token is required to access the Baseplate package. This will be stored in the .env file in your project directory.\n',
    ),
  );

  const { npmToken, cliVersion } = await getNpmTokenAndVersion();

  await generateBaseplateProject({
    packageName,
    directory: resolvedDirectory,
    npmToken,
    cliVersion,
  });
}

runMain().catch((err) => {
  if (err instanceof ExitPromptError) {
    return;
  }
  console.error(
    chalk.red(
      `An error occurred while creating the project:\n\n${
        err instanceof Error ? err.message : String(err)
      }\n`,
    ),
  );
  process.exit(1);
});
