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
  const duplicateNameErrors: string[] = [];

  for (const [type, files] of filesByType) {
    // Get unique files based on generator/template combination
    // This ensures we only get the files that have been modified the latest
    const uniqueTemplateFiles = uniqBy(files, (f) =>
      JSON.stringify({
        g: f.metadata.generator,
        t: f.metadata.template,
      }),
    );

    // Check for duplicate names within the same generator
    const duplicateNames = findDuplicateNamesInGenerator(uniqueTemplateFiles);

    if (duplicateNames.length > 0) {
      duplicateNameErrors.push(
        ...duplicateNames.map(
          (f) =>
            `Duplicate name "${f.metadata.name}" in generator "${f.metadata.generator}" at: ${f.absolutePath}`,
        ),
      );
    }

    result[type] = uniqueTemplateFiles;
  }

  // Throw error if any duplicates were found
  if (duplicateNameErrors.length > 0) {
    throw new Error(
      `Duplicate template names found:\n${duplicateNameErrors.join('\n')}`,
    );
  }

  return result;
}

/**
 * Finds files with duplicate names within the same generator
 */
function findDuplicateNamesInGenerator(
  files: TemplateMetadataFileEntry[],
): TemplateMetadataFileEntry[] {
  const duplicates: TemplateMetadataFileEntry[] = [];
  const seen = new Map<string, TemplateMetadataFileEntry>();

  for (const file of files) {
    const key = `${file.metadata.generator}:${file.metadata.name}`;
    const existing = seen.get(key);

    if (existing) {
      // Add both files as duplicates (if not already added)
      if (!duplicates.includes(existing)) {
        duplicates.push(existing);
      }
      duplicates.push(file);
    } else {
      seen.set(key, file);
    }
  }

  return duplicates;
}
