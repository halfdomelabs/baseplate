import { compareStrings } from '@baseplate-dev/utils';

import type { TsTemplateFileProjectExport } from '../../templates/types.js';

import { inferExportsFromTsSource } from './infer-exports-from-ts-file.js';

/**
 * A template whose declared project exports are missing from its source file.
 */
export interface MissingProjectExportsEntry {
  generatorName: string;
  templateName: string;
  sourceAbsolutePath: string;
  missingExports: string[];
}

/**
 * Finds the project exports declared by a template that its source file does not export.
 *
 * Wildcard (`*`) entries are ignored since they do not name a symbol, as are files with
 * `export * from` declarations where an export may be re-exported from another module.
 *
 * @param projectExports - The project exports declared by the template.
 * @param sourceAbsolutePath - The absolute path of the source file.
 * @param contents - The contents of the source file.
 * @returns The names of the declared exports missing from the file, sorted.
 */
export function findMissingProjectExports(
  projectExports: Record<string, TsTemplateFileProjectExport> | undefined,
  sourceAbsolutePath: string,
  contents: string,
): string[] {
  const declaredNames = Object.entries(projectExports ?? {})
    .filter(([name]) => name !== '*')
    .map(([name, projectExport]) => projectExport.exportedAs ?? name);
  if (declaredNames.length === 0) return [];

  const { exports, hasStarExports } = inferExportsFromTsSource(
    sourceAbsolutePath,
    contents,
  );
  if (hasStarExports) return [];

  return declaredNames.filter((name) => !exports.has(name)).toSorted();
}

/**
 * Builds the error message for templates declaring project exports that no longer exist.
 */
export function buildMissingProjectExportsMessage(
  entries: MissingProjectExportsEntry[],
): string {
  const details = entries
    .toSorted(
      (a, b) =>
        compareStrings(a.generatorName, b.generatorName) ||
        compareStrings(a.templateName, b.templateName),
    )
    .map(
      ({ generatorName, templateName, sourceAbsolutePath, missingExports }) =>
        `  - ${generatorName}#${templateName}: ${missingExports.join(', ')} (${sourceAbsolutePath})`,
    )
    .join('\n');
  return `The following templates declare projectExports that no longer exist in their source file. Update or remove the entries in extractor.json:\n${details}`;
}
