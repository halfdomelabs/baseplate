import type { TemplateExtractorConfigLookup } from '@baseplate-dev/sync';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';

import type { TsTemplateFileProjectExport } from '../templates/types.js';

import { tsImportProviderConfigSchema } from './ts-import-provider-config.schema.js';

export interface ExternalImportProviderEntry {
  packagePathSpecifier: string;
  providerExportName: string;
  importProviderSchemaName: string;
  projectExports: Record<string, TsTemplateFileProjectExport>;
}

/**
 * Builds a map of import provider names to their configurations and package path specifiers
 *
 * @param configLookup - The template extractor config lookup service
 * @returns Map of providerName (package:providerExport) => resolved config
 */
export function buildExternalImportProvidersMap(
  configLookup: TemplateExtractorConfigLookup,
): Map<string, ExternalImportProviderEntry> {
  const resolvedProviders = new Map<string, ExternalImportProviderEntry>();
  // Get the provider configs for ts-imports type
  const tsImportProviders = configLookup.getProviderConfigsByType(
    'ts-imports',
    tsImportProviderConfigSchema,
  );

  for (const importProvider of tsImportProviders) {
    try {
      // Create the resolved provider key using package:providerExport format
      const resolvedProviderKey = `${importProvider.packageName}:${importProvider.config.providerExport}`;

      if (resolvedProviders.has(resolvedProviderKey)) {
        throw new Error(
          `Import provider ${resolvedProviderKey} already exists. Please make sure there is only one import provider of that name per package.`,
        );
      }

      resolvedProviders.set(resolvedProviderKey, {
        packagePathSpecifier: importProvider.packagePathSpecifier,
        providerExportName: importProvider.config.providerExport,
        importProviderSchemaName: importProvider.config.schemaExport,
        projectExports: importProvider.config.projectExports,
      });
    } catch (error) {
      throw enhanceErrorWithContext(
        error,
        `Error constructing import provider map for ${importProvider.providerName} in ${importProvider.packagePathSpecifier}`,
      );
    }
  }

  return resolvedProviders;
}
