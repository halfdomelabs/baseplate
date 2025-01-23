import { createBuilderActionCreator } from '@halfdomelabs/sync';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ImportMapper } from '../providers/index.js';
import type { ModuleResolutionKind, PathMapEntry } from '../writers/index.js';

import { TypescriptSourceFile } from '../writers/index.js';

export interface CopyTypescriptFileOptions {
  destination?: string;
  id?: string;
  source: string;
  replacements?: Record<string, string>;
  importMappers?: ImportMapper[];
  pathMappings?: PathMapEntry[];
  moduleResolution: ModuleResolutionKind;
  shouldNeverOverwrite?: boolean;
}

function formatImports(
  source: string,
  destination: string,
  options: CopyTypescriptFileOptions,
): string {
  const file = new TypescriptSourceFile(
    {},
    {
      pathMappings: options.pathMappings,
      importMappers: options.importMappers,
      moduleResolution: options.moduleResolution,
    },
  );

  return file.renderToText(source, destination);
}

export const copyTypescriptFileAction = createBuilderActionCreator<
  [CopyTypescriptFileOptions]
>((options: CopyTypescriptFileOptions) => async (builder) => {
  const {
    destination,
    source,
    replacements = {},
    shouldNeverOverwrite,
  } = options;

  const templatePath = path.join(
    builder.generatorBaseDirectory,
    'templates',
    source,
  );

  const fileContents = await fs.readFile(templatePath, 'utf8');
  // strip any ts-nocheck from header
  const strippedContents = fileContents.replace(/^\/\/ @ts-nocheck\n/, '');
  // process any replacement
  let replacedContents = strippedContents;
  for (const [key, value] of Object.entries(replacements)) {
    replacedContents = replacedContents.replaceAll(new RegExp(key, 'g'), value);
  }

  const destinationPath = destination ?? source;

  const fullPath = builder.resolvePath(destinationPath);

  // apply any wrappers if needed
  const needsParsing = options.importMappers ?? options.pathMappings;
  const formattedContents = needsParsing
    ? formatImports(replacedContents, fullPath, options)
    : replacedContents;

  builder.writeFile({
    id: options.id ?? destinationPath,
    filePath: destinationPath,
    contents: formattedContents,
    options: {
      shouldFormat: true,
      shouldNeverOverwrite,
    },
  });
});
