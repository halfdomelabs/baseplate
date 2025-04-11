import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createBuilderActionCreator } from '@src/output/builder-action.js';

interface Options {
  destination: string;
  source: string;
  shouldFormat?: boolean;
}

export const copyDirectoryAction = createBuilderActionCreator<[Options]>(
  (options: Options) => async (builder) => {
    const { destination, source, shouldFormat } = options;

    const templatePath = path.join(
      builder.generatorInfo.baseDirectory,
      'templates',
      source,
    );

    // read all files in directory
    const files = await globby(path.join(templatePath, '**/*'), {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
    });

    await Promise.all(
      files.map(async (file) => {
        const relativePath = path.relative(templatePath, file);
        const destinationPath = path.join(destination, relativePath);

        if (shouldFormat) {
          const fileContents = await fs.readFile(file, 'utf8');
          builder.writeFile({
            id: destinationPath,
            destination: destinationPath,
            contents: fileContents,
            options: {
              shouldFormat: true,
            },
          });
        } else {
          const fileContents = await fs.readFile(file);
          builder.writeFile({
            id: destinationPath,
            destination: destinationPath,
            contents: fileContents,
          });
        }
      }),
    );
  },
);
