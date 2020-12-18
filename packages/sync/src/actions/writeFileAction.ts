import { promises as fs } from 'fs';
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
    await fs.writeFile(path.join(currentDirectory, destination), contents, {
      encoding: 'utf-8',
    });
  }
);
