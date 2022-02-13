import path from 'path';
import { createBuilderActionCreator } from '@baseplate/sync';
import fs from 'fs-extra';

interface Options {
  destination: string;
  source: string;
}

export const copyTypescriptFileAction = createBuilderActionCreator(
  (options: Options) => async (builder) => {
    const { destination, source } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source
    );

    const fileContents = await fs.readFile(templatePath, 'utf8');
    // strip any ts-nocheck from header
    const strippedContents = fileContents.replace(/^\/\/ @ts-nocheck\n/, '');
    builder.writeFile(destination, strippedContents, {
      shouldFormat: true,
    });
  }
);
