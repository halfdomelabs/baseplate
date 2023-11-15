import { createBuilderActionCreator } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import path from 'path';

import { ImportMapper } from '../providers/index.js';
import { PathMapEntry, TypescriptSourceFile } from '../writers/index.js';

export interface CopyTypescriptFileOptions {
  destination?: string;
  source: string;
  replacements?: Record<string, string>;
  importMappers?: ImportMapper[];
  pathMappings?: PathMapEntry[];
  neverOverwrite?: boolean;
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
    },
  );

  return file.renderToText(source, destination);
}

export const copyTypescriptFileAction = createBuilderActionCreator<
  [CopyTypescriptFileOptions]
>((options: CopyTypescriptFileOptions) => async (builder) => {
  const { destination, source, replacements = {}, neverOverwrite } = options;

  const templatePath = path.join(
    builder.generatorBaseDirectory,
    'templates',
    source,
  );

  const fileContents = await fs.readFile(templatePath, 'utf8');
  // strip any ts-nocheck from header
  const strippedContents = fileContents.replace(/^\/\/ @ts-nocheck\n/, '');
  // process any replacement
  const replacedContents = Object.entries(replacements).reduce(
    (str, [key, value]) => str.replace(new RegExp(key, 'g'), value),
    strippedContents,
  );

  const destinationPath = destination ?? source;

  const fullPath = builder.resolvePath(destinationPath);

  // apply any wrappers if needed
  const needsParsing = options.importMappers ?? options.pathMappings;
  const formattedContents = needsParsing
    ? formatImports(replacedContents, fullPath, options)
    : replacedContents;

  builder.writeFile(destinationPath, formattedContents, {
    shouldFormat: true,
    neverOverwrite,
  });
});
