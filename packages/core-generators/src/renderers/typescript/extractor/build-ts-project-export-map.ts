import type { TemplateExtractorContext } from '@baseplate-dev/sync';

import path from 'node:path';

import type { ExternalImportProviderEntry } from './build-external-import-providers-map.js';

import {
  TS_TEMPLATE_TYPE,
  tsTemplateGeneratorTemplateMetadataSchema,
} from '../templates/types.js';
import { getDefaultImportProviderNames } from './default-import-providers.js';
import { GENERATED_IMPORT_PROVIDERS_FILE_NAME } from './render-ts-import-providers.js';
import { tsExtractorConfigSchema } from './ts-extractor-config.schema.js';

/**
 * A project export that represents a single export from a generator.
 */
export interface TsProjectExport {
  /**
   * The name of the export used in the import provider.
   */
  name: string;
  /**
   * The exported name of the export within the file, e.g. 'default' for default exports.
   *
   * If not provided, the name will be the same as the export name.
   */
  exportedName?: string;
  /**
   * The output relative path of the file that contains the export.
   */
  outputRelativePath: string;
  /**
   * Whether the export is a type only export.
   */
  isTypeOnly?: boolean;
  /**
   * The placeholder module specifier to import from the import provider, e.g. %configServiceImports
   */
  placeholderModuleSpecifier: string;
  /**
   * The package path specifier of the import provider, e.g. `@baseplate-dev/core-generators:src/renderers/plugins/typed-templates-file.ts`
   */
  providerPackagePathSpecifier: string;
  /**
   * The name of the import provider, e.g. configServiceImportsProvider
   */
  providerImportName: string;
}

/**
 * A map of output relative paths to a map of export names to project exports.
 */
export type TsProjectExportMap = Map<string, Map<string, TsProjectExport>>;

/**
 * Builds a map of output relative paths to a map of export names to project exports.
 *
 * @param context - The template extractor context.
 * @returns A map of output relative paths to a map of export names to project exports.
 */
export function buildTsProjectExportMap(
  context: TemplateExtractorContext,
  externalImportProvidersMap: Map<string, ExternalImportProviderEntry>,
): TsProjectExportMap {
  const generatorConfigs =
    context.configLookup.getGeneratorConfigsForExtractorType(
      TS_TEMPLATE_TYPE,
      tsTemplateGeneratorTemplateMetadataSchema,
      tsExtractorConfigSchema,
    );

  const projectExportMap: TsProjectExportMap = new Map();

  for (const generatorConfig of generatorConfigs) {
    const {
      generatorName,
      generatorDirectory,
      packageName,
      templates,
      packagePath,
      config,
    } = generatorConfig;

    const externalImportProviders =
      config.importProviders?.map((importProvider) => {
        const externalImportProvider =
          externalImportProvidersMap.get(importProvider);
        if (!externalImportProvider) {
          throw new Error(
            `Import provider ${importProvider} not found in external import providers map.`,
          );
        }
        return externalImportProvider;
      }) ?? [];

    // Figure out the default import provider
    const importProviderNames = getDefaultImportProviderNames(generatorName);

    const relativeGeneratorDirectory = path.relative(
      packagePath,
      generatorDirectory,
    );
    const defaultImportsProviderPackagePathSpecifier = `${packageName}:${relativeGeneratorDirectory}/generated/${GENERATED_IMPORT_PROVIDERS_FILE_NAME}`;

    const getImportProvider = (
      projectExportName: string,
    ): {
      packagePathSpecifier: string;
      providerExportName: string;
      placeholderModuleSpecifier: string;
    } => {
      const importProvider = externalImportProviders.find(
        (importProvider) => projectExportName in importProvider.projectExports,
      );
      if (importProvider) {
        return {
          packagePathSpecifier: importProvider.packagePathSpecifier,
          providerExportName: importProvider.providerExportName,
          // TODO[2025-06-18]: Standardize this function
          placeholderModuleSpecifier: `%${importProvider.providerExportName.replace(
            /Provider$/,
            '',
          )}`,
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

    for (const [, template] of Object.entries(templates)) {
      // skip non-singleton templates
      if (template.fileOptions.kind !== 'singleton') continue;

      const outputRelativePath =
        context.configLookup.getOutputRelativePathForTemplate(
          generatorName,
          template.name,
        );
      if (!outputRelativePath) {
        // if the template file was not written, skip it
        continue;
      }

      const templateProjectExportsMap = new Map<string, TsProjectExport>();

      for (const [name, projectExport] of Object.entries(
        template.projectExports ?? {},
      )) {
        const importProvider = getImportProvider(name);

        templateProjectExportsMap.set(projectExport.exportName ?? name, {
          name,
          exportedName: projectExport.exportName,
          outputRelativePath,
          placeholderModuleSpecifier: importProvider.placeholderModuleSpecifier,
          providerPackagePathSpecifier: importProvider.packagePathSpecifier,
          providerImportName: importProvider.providerExportName,
        });
      }

      projectExportMap.set(outputRelativePath, templateProjectExportsMap);
    }
  }

  return projectExportMap;
}
