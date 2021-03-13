import { promises as fs } from 'fs';
import path from 'path';
import { createActionCreator } from '@baseplate/sync';
import R from 'ramda';

import childProcess from 'child_process';
import { promisify } from 'util';

const exec = promisify(childProcess.exec);

// not going to type it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageJson = any;

interface Options {
  baseDirectory?: string;
  contents: PackageJson;
}

async function compareContents(
  packagePath: string,
  contents: PackageJson
): Promise<boolean> {
  try {
    await fs.access(packagePath);
  } catch (err) {
    return false;
  }
  const existingJson = await fs.readFile(packagePath, 'utf-8');
  return JSON.stringify(contents) === JSON.stringify(JSON.parse(existingJson));
}

export const writePackageJson = createActionCreator<Options>(
  'write-package-json',
  async (options, context) => {
    const { currentDirectory } = context;
    const { baseDirectory, contents } = options;

    const packageBaseDirectory = path.join(
      currentDirectory,
      baseDirectory || ''
    );

    const packagePath = path.join(packageBaseDirectory, 'package.json');

    const areContentsEqual = await compareContents(packagePath, contents);

    // don't need to do anything if package.json is the same
    if (areContentsEqual) {
      return;
    }

    const json = JSON.stringify(contents, null, 2);
    await fs.writeFile(packagePath, json, {
      encoding: 'utf-8',
    });

    // run yarn install
    context.addPostActionCallback(async () => {
      console.log('Running yarn install...');
      await exec('yarn install', { cwd: packageBaseDirectory });
      console.log('Installed packages!');
    });

    // lint if it exists
    const dependencies = R.mergeAll([
      contents.dependencies,
      contents.devDependencies,
    ]);
    if (Object.keys(dependencies).includes('prettier')) {
      context.addPostActionCallback(async () => {
        console.log('Formatting package.json...');
        await exec('yarn prettier --write package.json', {
          cwd: packageBaseDirectory,
        });
        console.log('Formatted!');
      });
    }
  }
);
