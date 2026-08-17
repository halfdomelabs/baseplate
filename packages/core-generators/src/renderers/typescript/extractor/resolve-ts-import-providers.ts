import path from 'node:path';

import type { ExternalImportProviderEntry } from './build-external-import-providers-map.js';
import type { TsExtractorConfig } from './ts-extractor-config.schema.js';

import { getDefaultImportProviderNames } from './default-import-providers.js';
import { GENERATED_IMPORT_PROVIDERS_FILE_NAME } from './render-ts-import-providers.js';
import { createPlaceholderModuleSpecifier } from './utils/create-placeholder-module-specifier.js';

/**
 * A reference to the import provider that exposes a particular project export.
 */
export interface TsImportProviderReference {
  /**
   * The package path specifier of the import provider, e.g. `@baseplate-dev/core-generators:src/renderers/plugins/typed-templates-file.ts`
   */
  packagePathSpecifier: string;
  /**
   * The name of the import provider, e.g. configServiceImportsProvider
   */
  providerExportName: string;
  /**
   * The placeholder module specifier to import from the import provider, e.g. %configServiceImports
   */
  placeholderModuleSpecifier: string;
}

/**
 * The subset of a generator's extractor config needed to resolve its import providers.
 */
export interface TsImportProviderGeneratorConfig {
  generatorName: string;
  generatorDirectory: string;
  packageName: string;
  packagePath: string;
  config: TsExtractorConfig;
}

/**
 * Creates a resolver that maps a project export name to the import provider that exposes it.
 *
 * Project exports declared by one of the generator's external import providers resolve to that
 * provider; everything else falls back to the generator's own generated import provider.
 *
 * @param generatorConfig - The generator whose project exports are being resolved.
 * @param externalImportProvidersMap - A map of external import providers to use.
 * @returns A function resolving a project export name to its import provider.
 */
export function createTsImportProviderResolver(
  {
    generatorName,
    generatorDirectory,
    packageName,
    packagePath,
    config,
  }: TsImportProviderGeneratorConfig,
  externalImportProvidersMap: Map<string, ExternalImportProviderEntry>,
): (projectExportName: string) => TsImportProviderReference {
  const externalImportProviders =
    config.importProviders?.map((importProvider) => {
      const externalImportProvider =
        externalImportProvidersMap.get(importProvider);
      if (!externalImportProvider) {
        throw new Error(
          `Import provider ${importProvider} not found in external import providers map for generator ${generatorName} in ${packagePath}.`,
        );
      }
      return externalImportProvider;
    }) ?? [];

  const importProviderNames = getDefaultImportProviderNames(
    generatorName,
    config.defaultImportProviderName,
  );

  const relativeGeneratorDirectory = path.relative(
    packagePath,
    generatorDirectory,
  );
  const defaultImportsProviderPackagePathSpecifier = `${packageName}:${relativeGeneratorDirectory}/generated/${GENERATED_IMPORT_PROVIDERS_FILE_NAME}`;

  return (projectExportName) => {
    const importProvider = externalImportProviders.find(
      (importProvider) => projectExportName in importProvider.projectExports,
    );
    if (importProvider) {
      return {
        packagePathSpecifier: importProvider.packagePathSpecifier,
        providerExportName: importProvider.providerExportName,
        placeholderModuleSpecifier: createPlaceholderModuleSpecifier(
          importProvider.providerExportName,
        ),
      };
    }
    if (config.skipDefaultImportMap) {
      throw new Error(
        `Import provider not found for project export ${projectExportName} and default import map is disabled.`,
      );
    }
    return {
      packagePathSpecifier: defaultImportsProviderPackagePathSpecifier,
      providerExportName: importProviderNames.providerExportName,
      placeholderModuleSpecifier:
        importProviderNames.placeholderModuleSpecifier,
    };
  };
}
