import fs from 'fs/promises';
import path from 'path';
import { createBuilderActionCreator } from '../core/index.js';

interface Options {
  destination: string;
  source: string;
  shouldFormat?: boolean;
  neverOverwrite?: boolean;
  replacements?: Record<string, string>;
}

function applyReplacements(
  contents: string,
  replacements: Record<string, string>
): string {
  return Object.keys(replacements).reduce(
    (value, key) => value.replace(new RegExp(key, 'g'), replacements[key]),
    contents
  );
}

export const copyFileAction = createBuilderActionCreator<[Options]>(
  (options: Options) => async (builder) => {
    const { destination, source, shouldFormat, neverOverwrite, replacements } =
      options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source
    );

    if (shouldFormat || replacements) {
      const fileContents = await fs.readFile(templatePath, 'utf8');
      const replacedFileContents = applyReplacements(
        fileContents,
        replacements || {}
      );
      builder.writeFile(destination, replacedFileContents, {
        shouldFormat,
        neverOverwrite,
      });
    } else {
      const fileContents = await fs.readFile(templatePath);
      builder.writeFile(destination, fileContents, { neverOverwrite });
    }
  }
);
