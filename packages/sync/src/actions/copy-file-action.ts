import fs from 'node:fs/promises';
import path from 'node:path';

import { createBuilderActionCreator } from '@src/output/builder-action.js';
import { normalizePathToProjectPath } from '@src/utils/canonical-path.js';

interface Options {
  destination: string;
  source: string;
  skipFormatting?: boolean;
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
      skipFormatting,
      shouldNeverOverwrite,
      replacements,
    } = options;

    const templatePath = path.join(
      builder.generatorInfo.baseDirectory,
      'templates',
      source,
    );

    const fileContents = await fs.readFile(templatePath, 'utf8');
    const replacedFileContents = applyReplacements(
      fileContents,
      replacements ?? {},
    );
    builder.writeFile({
      id: normalizePathToProjectPath(destination),
      destination,
      contents: replacedFileContents,
      options: {
        skipFormatting,
        shouldNeverOverwrite,
      },
    });
  },
);
