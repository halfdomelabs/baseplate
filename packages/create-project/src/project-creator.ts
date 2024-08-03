/* eslint-disable no-console */
import type { ProjectDefinitionInput } from '@halfdomelabs/project-builder-lib';
import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';

export async function generateBaseplateProject({
  packageName,
  directory,
  npmToken,
  cliVersion,
}: {
  packageName: string;
  directory: string;
  npmToken: string;
  cliVersion: string;
}): Promise<void> {
  let spinner = ora({
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
            '@halfdomelabs/project-builder-cli': cliVersion,
          },
          engines: {
            node: '^20.15.0',
            pnpm: '^9.5.0',
          },
          volta: {
            node: '20.15.1',
          },
        },
        null,
        2,
      ),
    );

    await writeFile(
      'baseplate/project.json',
      JSON.stringify(
        {
          name: packageName,
          features: [],
          models: [],
          portOffset: 3000,
        } satisfies ProjectDefinitionInput,
        null,
        2,
      ),
    );

    await copyFile('.gitignore', '.gitignore');
    await copyFile('.pnpmfile.cjs', '.pnpmfile.cjs');
    await copyFile('.template.npmrc', '.template.npmrc');
    await copyFile('scripts/setup-npmrc.cjs', 'scripts/setup-npmrc.cjs');
    await copyFile('README.md', 'README.md');

    await writeFile('.env', `NPM_TOKEN=${npmToken}\n`);

    spinner.succeed();

    spinner = ora({
      text: 'Installing dependencies...',
    }).start();

    await execa({ cwd: directory })`node .pnpmfile.cjs --silent`;

    await execa({ cwd: directory })`pnpm install`;

    spinner.succeed();

    const relativePath = path.relative(process.cwd(), directory);

    console.log('');
    console.log(
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
