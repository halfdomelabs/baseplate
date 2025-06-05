import { sortObjectKeys, stringifyPrettyCompact } from '@baseplate-dev/utils';
import { groupBy } from 'es-toolkit';
import path from 'node:path';

import type { TemplateExtractorConfigLookup } from '../configs/template-extractor-config-lookup.js';
import type { TemplateExtractorFileContainer } from '../runner/template-extractor-file-container.js';
import type { TemplateFileExtractorMetadataEntry } from '../runner/template-file-extractor.js';

/**
 * Updates extractor configurations with new template entries by grouping metadata
 * entries by generator and upserting them into the respective generators.json files.
 *
 * @param metadataEntries - Array of template file extractor metadata entries
 * @param configLookup - Configuration lookup service for finding generator configs
 * @param fileContainer - File container for writing updated configurations
 * @throws Error if no config is found for a generator
 */
export function updateExtractorTemplateEntries(
  metadataEntries: TemplateFileExtractorMetadataEntry[],
  configLookup: TemplateExtractorConfigLookup,
  fileContainer: TemplateExtractorFileContainer,
): void {
  // Group metadata entries by generator
  const metadataEntriesByGenerator = groupBy(
    metadataEntries,
    (e) => e.generator,
  );

  for (const [generator, entries] of Object.entries(
    metadataEntriesByGenerator,
  )) {
    const generatorConfig = configLookup.getExtractorConfig(generator);
    if (!generatorConfig) {
      throw new Error(`No config found for generator: ${generator}`);
    }

    // Upsert template entries into the generators.json file
    const { name, templates, extractors, ...rest } = generatorConfig.config;
    const newConfig = {
      name,
      extractors,
      templates: sortObjectKeys({
        ...templates,
        ...Object.fromEntries(
          entries.map((e) => [e.templatesPath, e.metadata]),
        ),
      }),
      ...rest,
    };

    // Write the new config to the generators.json file and update the cache
    fileContainer.writeFile(
      path.join(generatorConfig.generatorDirectory, 'generators.json'),
      stringifyPrettyCompact(newConfig),
    );
    configLookup.setExtractorConfig(generator, newConfig);
  }
}
