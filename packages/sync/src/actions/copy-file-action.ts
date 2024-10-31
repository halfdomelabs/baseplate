import fs from 'node:fs/promises';
import path from 'node:path';

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
  replacements: Record<string, string>,
): string {
  let result = contents;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(new RegExp(key, 'g'), value);
  }
  return result;
}

export const copyFileAction = createBuilderActionCreator<[Options]>(
  (options: Options) => async (builder) => {
    const { destination, source, shouldFormat, neverOverwrite, replacements } =
      options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source,
    );

    if (shouldFormat ?? replacements) {
      const fileContents = await fs.readFile(templatePath, 'utf8');
      const replacedFileContents = applyReplacements(
        fileContents,
        replacements ?? {},
      );
      builder.writeFile(destination, replacedFileContents, {
        shouldFormat,
        neverOverwrite,
      });
    } else {
      const fileContents = await fs.readFile(templatePath);
      builder.writeFile(destination, fileContents, { neverOverwrite });
    }
  },
);
