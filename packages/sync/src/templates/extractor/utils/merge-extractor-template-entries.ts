import { groupBy } from 'es-toolkit';

import type { TemplateExtractorContext } from '../runner/template-extractor-context.js';
import type { TemplateFileExtractorMetadataEntry } from '../runner/template-file-extractor.js';

import { sortExtractorConfigKeys } from './sort-extractor-config-keys.js';

/**
 * Merges template entries into extractor configurations by grouping metadata
 * entries by generator and upserting them into the respective config objects.
 * This function only updates the in-memory configurations and does not write files.
 *
 * @param metadataEntries - Array of template file extractor metadata entries
 * @param context - Template extractor context containing config lookup
 * @throws Error if no config is found for a generator
 */
export function mergeExtractorTemplateEntries(
  metadataEntries: TemplateFileExtractorMetadataEntry[],
  context: TemplateExtractorContext,
): void {
  // Group metadata entries by generator
  const metadataEntriesByGenerator = groupBy(
    metadataEntries,
    (e) => e.generator,
  );

  for (const [generator, entries] of Object.entries(
    metadataEntriesByGenerator,
  )) {
    const generatorConfig = context.configLookup.getExtractorConfig(generator);
    if (!generatorConfig) {
      throw new Error(`No 'extractor.json' found for generator: ${generator}`);
    }

    // Upsert template entries into the extractor.json file
    const { templates } = generatorConfig.config;

    // Create a map of new templates to add
    const newTemplates = Object.fromEntries(
      entries.map((e) => [e.generatorTemplatePath, e.metadata]),
    );

    // Remove any existing templates that have the same name as new templates
    // This prevents duplicates when template names match but paths differ
    const newTemplateNames = new Set(entries.map((e) => e.metadata.name));

    const filteredExistingTemplates = Object.fromEntries(
      Object.entries(templates).filter(
        ([, templateConfig]) => !newTemplateNames.has(templateConfig.name),
      ),
    );

    const newConfig = sortExtractorConfigKeys({
      ...generatorConfig.config,
      templates: {
        ...filteredExistingTemplates,
        ...newTemplates,
      },
    });

    // Update the in-memory config cache
    context.configLookup.setExtractorConfig(generator, newConfig);
  }
}
