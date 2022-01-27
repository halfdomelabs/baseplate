import path from 'path';
import fs from 'fs-extra';
import recursive from 'recursive-readdir';
import { makeBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  source: string;
  shouldFormat: boolean;
}

export const copyDirectoryAction = makeBuilderActionCreator(
  (options: Options) => async (builder) => {
    const { destination, source, shouldFormat } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source
    );

    // read all files in directory
    const files = await recursive(templatePath);

    await Promise.all(
      files.map(async (file) => {
        const relativePath = path.relative(templatePath, file);
        const destinationPath = path.join(destination, relativePath);

        if (shouldFormat) {
          const fileContents = await fs.readFile(file, 'utf8');
          builder.writeFile(destinationPath, fileContents, {
            shouldFormat: true,
          });
        } else {
          const fileContents = await fs.readFile(file);
          builder.writeFile(destinationPath, fileContents);
        }
      })
    );
  }
);
