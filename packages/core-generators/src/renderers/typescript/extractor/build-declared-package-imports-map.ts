import type { TemplateExtractorContext } from '@baseplate-dev/sync';

import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import path from 'node:path';
import { z } from 'zod';

import type { ExternalImportProviderEntry } from './build-external-import-providers-map.js';
import type { TsResolvedProjectExport } from './build-ts-project-export-map.js';

import {
  TS_TEMPLATE_TYPE,
  tsTemplateMetadataSchema,
} from '../templates/types.js';
import { createTsImportProviderResolver } from './resolve-ts-import-providers.js';
import { tsExtractorConfigSchema } from './ts-extractor-config.schema.js';

export const PACKAGE_IMPORTS_METADATA_FILE = '.package-imports-metadata.json';

/**
 * A cross-package import declared by the generator that wired it up during sync.
 */
const declaredPackageImportSchema = z.object({
  /**
   * The literal module specifier written into the generated code, e.g. `@my-project/ui-shared`.
   */
  moduleSpecifier: z.string(),
  /**
   * The fully qualified name of the generator that owns the import provider backing the
   * module specifier, e.g. `@baseplate-dev/react-generators#core/react-components`.
   */
  generatorName: z.string(),
});

export type DeclaredPackageImport = z.infer<typeof declaredPackageImportSchema>;

const declaredPackageImportsFileSchema = z.array(declaredPackageImportSchema);

/**
 * A module specifier that resolves to an import provider instead of a file in the package.
 */
export interface DeclaredPackageImportEntry {
  moduleSpecifier: string;
  generatorName: string;
  /**
   * The project exports the provider exposes, keyed by their exported name.
   */
  projectExports: Map<string, TsResolvedProjectExport>;
}

/**
 * A map of literal module specifiers to the import provider that backs them.
 */
export type DeclaredPackageImportMap = Map<string, DeclaredPackageImportEntry>;

/**
 * Builds a map of cross-package module specifiers to the import providers that back them.
 *
 * The entries come from the `.package-imports-metadata.json` written into the package during
 * sync, so only imports a generator explicitly declared are resolvable — every other workspace
 * package import is still rejected by the template import guard.
 *
 * @param context - The template extractor context.
 * @param externalImportProvidersMap - A map of external import providers to use.
 * @returns A map of module specifiers to their import provider entries.
 */
export async function buildDeclaredPackageImportsMap(
  context: TemplateExtractorContext,
  externalImportProvidersMap: Map<string, ExternalImportProviderEntry>,
): Promise<DeclaredPackageImportMap> {
  const { outputDirectory } = context;
  if (!outputDirectory) return new Map();

  const declaredImports = await readJsonWithSchema(
    path.join(outputDirectory, PACKAGE_IMPORTS_METADATA_FILE),
    declaredPackageImportsFileSchema,
  ).catch(handleFileNotFoundError);

  if (!declaredImports || declaredImports.length === 0) return new Map();

  const generatorConfigs =
    context.configLookup.getGeneratorConfigsForExtractorType(
      TS_TEMPLATE_TYPE,
      tsTemplateMetadataSchema,
      tsExtractorConfigSchema,
    );
  const generatorConfigsByName = new Map(
    generatorConfigs.map((config) => [config.generatorName, config]),
  );

  const declaredPackageImportMap: DeclaredPackageImportMap = new Map();

  for (const { moduleSpecifier, generatorName } of declaredImports) {
    const generatorConfig = generatorConfigsByName.get(generatorName);
    if (!generatorConfig) {
      throw new Error(
        `Package import "${moduleSpecifier}" declares generator ${generatorName} which has no TypeScript extractor config. ` +
          `Check the generator name registered with registerPackageImportProvider.`,
      );
    }

    const getImportProvider = createTsImportProviderResolver(
      generatorConfig,
      externalImportProvidersMap,
    );

    const projectExports = new Map<string, TsResolvedProjectExport>();
    for (const template of Object.values(generatorConfig.templates)) {
      for (const [name, projectExport] of Object.entries(
        template.projectExports ?? {},
      )) {
        const importProvider = getImportProvider(name);
        projectExports.set(projectExport.exportedAs ?? name, {
          name,
          exportedName: projectExport.exportedAs,
          isTypeOnly: projectExport.isTypeOnly,
          placeholderModuleSpecifier: importProvider.placeholderModuleSpecifier,
          providerPackagePathSpecifier: importProvider.packagePathSpecifier,
          providerImportName: importProvider.providerExportName,
        });
      }
    }

    declaredPackageImportMap.set(moduleSpecifier, {
      moduleSpecifier,
      generatorName,
      projectExports,
    });
  }

  return declaredPackageImportMap;
}
