import fs from 'fs-extra';
import path from 'path';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  source: string;
}

export const copyDirectoryAction = createActionCreator<Options>(
  'copy-directory',
  async (options, context) => {
    const { currentDirectory, generatorDirectory } = context;
    const { destination, source } = options;

    const templatePath = path.join(generatorDirectory, 'templates', source);
    const destinationPath = path.join(currentDirectory, destination);

    await fs.ensureDir(path.dirname(destinationPath));
    await fs.copy(templatePath, destinationPath);
  }
);
