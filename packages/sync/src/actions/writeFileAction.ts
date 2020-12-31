import fs from 'fs-extra';
import path from 'path';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  contents: string;
}

export const writeFileAction = createActionCreator<Options>(
  'write-file',
  async (options, context) => {
    const { currentDirectory } = context;
    const { destination, contents } = options;
    const destinationPath = path.join(currentDirectory, destination);

    await fs.ensureDir(path.dirname(destinationPath));
    await fs.writeFile(destinationPath, contents, {
      encoding: 'utf-8',
    });
  }
);
