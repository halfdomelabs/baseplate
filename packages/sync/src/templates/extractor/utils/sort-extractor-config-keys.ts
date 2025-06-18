import { sortKeysRecursive, sortObjectKeys } from '@baseplate-dev/utils';
import { mapValues } from 'es-toolkit';

import type {
  ExtractorConfig,
  TemplateConfig,
} from '../configs/extractor-config.schema.js';

export function sortExtractorConfigTemplateKeys(
  template: TemplateConfig,
): TemplateConfig {
  const { name, type, ...rest } = template;
  return {
    name,
    type,
    ...sortKeysRecursive(rest),
  };
}

/**
 * Sorts the extractor.json configs in a standardized way.
 * @param extractorConfig - The extractor.json config to sort
 * @returns The sorted extractor.json config
 */
export function sortExtractorConfigKeys({
  name,
  extractors,
  plugins,
  templates,
  ...rest
}: ExtractorConfig): ExtractorConfig {
  return {
    name,
    extractors: sortKeysRecursive(extractors),
    plugins: sortKeysRecursive(plugins),
    templates: sortObjectKeys(
      mapValues(templates, sortExtractorConfigTemplateKeys),
    ),
    ...sortKeysRecursive(rest),
  };
}
