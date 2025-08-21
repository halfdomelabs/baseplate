import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';

import { exec } from './exec.js';

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
    await fs.mkdir(directory, {
      recursive: true,
    });

    const writeFile = async (
      destination: string,
      content: string | Buffer,
    ): Promise<void> => {
      const destinationPath = path.join(directory, destination);
      await fs.mkdir(path.dirname(destinationPath), {
        recursive: true,
      });
      await fs.writeFile(destinationPath, content);
    };

    const copyFile = async (
      templateSrc: string,
      destination: string,
    ): Promise<void> => {
      // template files are stored at ../templates
      const source = new URL(`../templates/${templateSrc}`, import.meta.url);
      const sourceFile = await fs.readFile(source);
      await writeFile(destination, sourceFile);
    };

    // write package.json
    await writeFile(
      'package.json',
      JSON.stringify(
        {
          name: packageName,
          version: '0.1.0',
          private: true,
          description: 'A Baseplate project',
          license: 'UNLICENSED',
          author: '<AUTHOR>',
          scripts: {
            'baseplate:serve': 'baseplate serve',
            'baseplate:generate': 'baseplate generate',
            preinstall: 'npx only-allow pnpm',
          },
          devDependencies: {
            '@baseplate-dev/project-builder-cli': cliVersion,
          },
          packageManager: 'pnpm@10.15.0',
          engines: {
            node: '^22.0.0',
            pnpm: '^10.15.0',
          },
          volta: {
            node: '22.19.0',
          },
        },
        null,
        2,
      ),
    );

    await copyFile('.gitignore', '.gitignore');
    await copyFile('.template.npmrc', '.npmrc');
    await copyFile('README.md', 'README.md');

    spinner.succeed();

    await exec('pnpm install', directory);

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
  } finally {
    if (spinner.isSpinning) {
      spinner.fail();
    }
  }
}
