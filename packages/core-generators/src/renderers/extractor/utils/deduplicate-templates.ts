import type { TemplateFileExtractorSourceFile } from '@baseplate-dev/sync';

import type { TemplateFileOptions } from '#src/renderers/schemas/template-file-options.js';

/**
 * Deduplicate source files for the template file extractor
 *
 * @param files Array of soruce files
 * @returns Array of deduplicated source files
 */
export function deduplicateTemplateFileExtractorSourceFiles<
  T extends TemplateFileExtractorSourceFile,
>(files: T[]): T[] {
  const addedTemplates = new Set();
  const deduplicatedList: T[] = [];

  // Sort by modified time to ensure the latest version is used
  for (const file of files.toSorted(
    (a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime(),
  )) {
    const fileKey = `${file.metadata.generator}__${file.metadata.name}`;
    if (addedTemplates.has(fileKey)) {
      if (
        'fileOptions' in file.metadata &&
        (file.metadata.fileOptions as TemplateFileOptions).kind === 'singleton'
      ) {
        throw new Error(`Duplicate singleton template found: ${fileKey}`);
      } else {
        // instance templates are allowed to be duplicated
        continue;
      }
    }
    addedTemplates.add(fileKey);
    deduplicatedList.push(file);
  }

  return deduplicatedList;
}
