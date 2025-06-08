import { sortObjectKeys, stringifyPrettyCompact } from '@baseplate-dev/utils';
import { groupBy } from 'es-toolkit';
import path from 'node:path';

import type { TemplateExtractorContext } from '../runner/template-extractor-context.js';
import type { TemplateFileExtractorMetadataEntry } from '../runner/template-file-extractor.js';

/**
 * Updates extractor configurations with new template entries by grouping metadata
 * entries by generator and upserting them into the respective generators.json files.
 *
 * @param metadataEntries - Array of template file extractor metadata entries
 * @param context - Template extractor context containing config lookup and file container
 * @throws Error if no config is found for a generator
 */
export function updateExtractorTemplateEntries(
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
      throw new Error(`No config found for generator: ${generator}`);
    }

    // Upsert template entries into the generators.json file
    const { name, templates, extractors, ...rest } = generatorConfig.config;

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

    const newConfig = {
      name,
      extractors,
      templates: sortObjectKeys({
        ...filteredExistingTemplates,
        ...newTemplates,
      }),
      ...rest,
    };

    // Write the new config to the generators.json file and update the cache
    context.fileContainer.writeFile(
      path.join(generatorConfig.generatorDirectory, 'generators.json'),
      stringifyPrettyCompact(newConfig),
    );
    context.configLookup.setExtractorConfig(generator, newConfig);
  }
}
