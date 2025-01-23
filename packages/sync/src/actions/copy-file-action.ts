import fs from 'node:fs/promises';
import path from 'node:path';

import { createBuilderActionCreator } from '@src/output/builder-action.js';

interface Options {
  destination: string;
  source: string;
  shouldFormat?: boolean;
  shouldNeverOverwrite?: boolean;
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
    const {
      destination,
      source,
      shouldFormat,
      shouldNeverOverwrite,
      replacements,
    } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      source,
    );

    const fileContents = await fs.readFile(templatePath, 'utf8');
    const replacedFileContents = applyReplacements(
      fileContents,
      replacements ?? {},
    );
    builder.writeFile({
      id: destination,
      filePath: destination,
      contents: replacedFileContents,
      options: {
        shouldFormat,
        shouldNeverOverwrite,
      },
    });
  },
);
