import chalk from 'chalk';
import path from 'node:path';
import ora from 'ora';

import { generateRootPackage } from './project-generator.js';

/**
 * Shows a success message with instructions for getting started.
 */
function showSuccessMessage(directory: string): void {
  const relativePath = path.relative(process.cwd(), directory);

  console.info('');
  console.info(
    `
🎉 Congratulations! Your Baseplate project has been created. To get started, run the following command${
      relativePath === '' ? '' : 's'
    }:
${relativePath === '' ? '' : chalk.bold(`\ncd ${relativePath}`)}
${chalk.bold('pnpm baseplate serve')}

For more information, read the included README.md file.
`.trim(),
  );
}

export async function generateBaseplateProject({
  packageName,
  directory,
  cliVersion,
}: {
  packageName: string;
  directory: string;
  cliVersion: string;
}): Promise<void> {
  const spinner = ora({
    text: 'Creating project files...',
  }).start();
  try {
    // Generate root package files using sync engine
    // This includes package.json, turbo.json, pnpm-workspace.yaml, .gitignore, etc.
    // It also runs pnpm install as a post-write command
    await generateRootPackage({
      name: packageName,
      cliVersion,
      directory,
    });

    spinner.succeed();
    showSuccessMessage(directory);
  } finally {
    if (spinner.isSpinning) {
      spinner.fail();
    }
  }
}
