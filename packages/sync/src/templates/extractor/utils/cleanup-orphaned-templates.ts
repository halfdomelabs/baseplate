import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Logger } from '#src/utils/evented-logger.js';

import type { OrphanedTemplateEntry } from '../../metadata/read-template-info-files.js';
import type { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';

import { removeTemplateInfoEntry } from '../../metadata/remove-template-info-entry.js';
import { TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY } from '../constants/directories.js';

/**
 * Cleans up orphaned templates where the generated file was manually deleted
 * but the metadata and extractor config still exist.
 *
 * For each orphaned entry:
 * 1. Removes the template from the extractor.json config (in-memory)
 * 2. Deletes the template source file if it exists
 * 3. Removes the entry from .templates-info.json
 *
 * @param orphanedEntries - Array of orphaned template entries
 * @param configLookup - Template extractor config lookup for accessing/modifying configs
 * @param logger - Logger for output
 * @returns Array of generator names that were modified (for later writing to disk)
 */
export async function cleanupOrphanedTemplates(
  orphanedEntries: OrphanedTemplateEntry[],
  configLookup: TemplateExtractorConfigLookup,
  logger: Logger,
): Promise<string[]> {
  const modifiedGenerators = new Set<string>();

  for (const entry of orphanedEntries) {
    const { templateInfo, metadataFilePath, fileName } = entry;
    const { template: templateName, generator: generatorName } = templateInfo;

    // Try to get the generator config and template config
    const generatorConfig = configLookup.getExtractorConfig(generatorName);

    if (generatorConfig) {
      const templateConfig = generatorConfig.config.templates[templateName] as
        | { sourceFile?: string }
        | undefined;

      // Delete the template source file if it exists
      if (templateConfig?.sourceFile) {
        const templateFilePath = path.join(
          generatorConfig.generatorDirectory,
          TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY,
          templateConfig.sourceFile,
        );
        await fs.unlink(templateFilePath).catch(handleFileNotFoundError);
      }

      // Remove from the in-memory config
      const removed = configLookup.removeExtractorTemplate(
        generatorName,
        templateName,
      );
      if (removed) {
        modifiedGenerators.add(generatorName);
      }
    } else {
      logger.warn(
        `Generator '${generatorName}' not found in config lookup, skipping extractor.json cleanup for template '${templateName}'`,
      );
    }

    // Remove from .templates-info.json
    await removeTemplateInfoEntry(metadataFilePath, fileName);

    logger.info(
      `Cleaned up orphaned template '${templateName}' for generator '${generatorName}'`,
    );
  }

  return [...modifiedGenerators];
}
