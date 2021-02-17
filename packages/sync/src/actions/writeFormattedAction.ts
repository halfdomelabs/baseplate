import fs from 'fs-extra';
import path from 'path';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  contents: string;
}

export const writeFormattedAction = createActionCreator<Options>(
  'write-template',
  async (options, context) => {
    const { currentDirectory, formatter } = context;
    const { destination } = options;
    let { contents } = options;

    const fullPath = path.join(currentDirectory, destination);
    if (formatter) {
      contents = await formatter.format(contents, fullPath);
    }
    const destinationPath = path.join(currentDirectory, destination);

    await fs.ensureDir(path.dirname(destinationPath));

    await fs.writeFile(destinationPath, contents, {
      encoding: 'utf-8',
    });
  }
);
