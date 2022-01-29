import path from 'path';
import fs from 'fs-extra';
import { createBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  source: string;
  shouldFormat: boolean;
}

export const copyFileAction = createBuilderActionCreator(
  (options: Options) => async (builder) => {
    const { destination, source, shouldFormat } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source
    );

    if (shouldFormat) {
      const fileContents = await fs.readFile(templatePath, 'utf8');
      builder.writeFile(destination, fileContents, { shouldFormat: true });
    } else {
      const fileContents = await fs.readFile(templatePath);
      builder.writeFile(destination, fileContents);
    }
  }
);
