import { mapGroupBy } from '@baseplate-dev/utils';
import { orderBy, uniqBy } from 'es-toolkit';

import type { TemplateMetadataFileEntry } from '../../metadata/read-template-metadata-files.js';

/**
 * Groups template files by type and ensures uniqueness per generator/template combination.
 * Also validates that there are no duplicate names within the same generator.
 *
 * @param templateFiles - Array of template metadata file entries
 * @returns Record of type to array of template files
 * @throws Error if duplicate names are found within the same generator
 */
export function groupTemplateFilesByType(
  templateFiles: TemplateMetadataFileEntry[],
): Record<string, TemplateMetadataFileEntry[]> {
  // Sort files by modification time (newest first)
  const sortedFiles = orderBy(templateFiles, [(f) => f.modifiedTime], ['desc']);

  // Group files by type
  const filesByType = mapGroupBy(sortedFiles, (m) => m.metadata.type);

  const result: Record<string, TemplateMetadataFileEntry[]> = {};

  for (const [type, files] of filesByType) {
    // Get unique files based on generator/name combination
    // This ensures we only get the files that have been modified the latest
    const uniqueTemplateFiles = uniqBy(files, (f) =>
      JSON.stringify({
        g: f.metadata.generator,
        t: f.metadata.name,
      }),
    );

    result[type] = uniqueTemplateFiles;
  }

  return result;
}
