import { parseGeneratorName } from '@baseplate-dev/sync';
import { camelCase, kebabCase, pascalCase } from 'change-case';

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
 * @returns The names of the import provider.
 */
export function getDefaultImportProviderNames(
  generatorName: string,
): TsImportProviderNames {
  const parsedGeneratorName = parseGeneratorName(generatorName);
  const { generatorBasename } = parsedGeneratorName;
  const providerTypeName = `${pascalCase(generatorBasename)}ImportsProvider`;
  const providerExportName = `${camelCase(generatorBasename)}ImportsProvider`;
  const providerSchemaName = `${camelCase(generatorBasename)}ImportsSchema`;
  const providerName = `${kebabCase(generatorBasename)}-imports`;
  const placeholderModuleSpecifier = `%${camelCase(generatorBasename)}Imports`;

  return {
    providerTypeName,
    providerExportName,
    providerSchemaName,
    providerName,
    placeholderModuleSpecifier,
  };
}
