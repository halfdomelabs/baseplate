import { parseGeneratorName } from '@baseplate-dev/sync';
import { camelCase, kebabCase, pascalCase } from 'change-case';

import { createPlaceholderModuleSpecifier } from './utils/create-placeholder-module-specifier.js';

export interface TsImportProviderNames {
  /**
   * The name of the import provider type e.g. NodeImportsProvider
   */
  providerTypeName: string;
  /**
   * The name of the import provider export, e.g. nodeImportsProvider
   */
  providerExportName: string;
  /**
   * The name of the import provider schema, e.g. `nodeImportsSchema`
   */
  providerSchemaName: string;
  /**
   * The name of the import provider, e.g. `node-imports`
   */
  providerName: string;
  /**
   * The placeholder module specifier for the import provider, e.g. `%node-imports`
   */
  placeholderModuleSpecifier: string;
}

/**
 * Gets the names of the default import provider.
 *
 * @param generatorName - The name of the generator.
 * @param defaultImportProviderName - The name of the default import provider if provided.
 * @returns The names of the import provider.
 */
export function getDefaultImportProviderNames(
  generatorName: string,
  defaultImportProviderName: string | undefined,
): TsImportProviderNames {
  const parsedGeneratorName = parseGeneratorName(generatorName);
  const generatorBasename =
    defaultImportProviderName?.replace(/ImportsProvider$/, '') ??
    parsedGeneratorName.generatorBasename;
  const providerTypeName = `${pascalCase(generatorBasename)}ImportsProvider`;
  const providerExportName = `${camelCase(generatorBasename)}ImportsProvider`;
  const providerSchemaName = `${camelCase(generatorBasename)}ImportsSchema`;
  const providerName = `${kebabCase(generatorBasename)}-imports`;
  const placeholderModuleSpecifier =
    createPlaceholderModuleSpecifier(providerExportName);

  return {
    providerTypeName,
    providerExportName,
    providerSchemaName,
    providerName,
    placeholderModuleSpecifier,
  };
}
