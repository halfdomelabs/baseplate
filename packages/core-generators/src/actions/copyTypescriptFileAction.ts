import path from 'path';
import { createBuilderActionCreator } from '@baseplate/sync';
import fs from 'fs-extra';

interface Options {
  destination?: string;
  source: string;
  replacements?: { [key: string]: string };
}

export const copyTypescriptFileAction = createBuilderActionCreator(
  (options: Options) => async (builder) => {
    const { destination, source, replacements = {} } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source
    );

    const fileContents = await fs.readFile(templatePath, 'utf8');
    // strip any ts-nocheck from header
    const strippedContents = fileContents.replace(/^\/\/ @ts-nocheck\n/, '');
    // process any replacement
    const replacedContents = Object.entries(replacements).reduce(
      (str, [key, value]) => str.replace(new RegExp(key, 'g'), value),
      strippedContents
    );

    builder.writeFile(destination || source, replacedContents, {
      shouldFormat: true,
    });
  }
);
