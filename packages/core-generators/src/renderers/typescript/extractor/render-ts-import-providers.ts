import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync';

import { quot } from '@baseplate-dev/utils';
import { camelCase } from 'change-case';
import { mapValues } from 'es-toolkit';

import type {
  TemplateExtractorBarrelExport,
  TemplateExtractorGeneratedBarrelExport,
} from '#src/renderers/extractor/index.js';

import {
  getGeneratedTemplateConstantName,
  getGeneratedTemplateExportName,
  resolvePackagePathSpecifier,
} from '#src/renderers/extractor/index.js';
import { GENERATED_PATHS_FILE_NAME } from '#src/renderers/extractor/plugins/template-paths/paths-file.js';
import { normalizeTsPathToJsPath } from '#src/utils/index.js';

import type { TsCodeFragment } from '../fragments/types.js';
import type { TsImportMapSchemaEntry } from '../import-maps/types.js';
import type {
  TsGeneratorTemplateMetadata,
  TsTemplateFileProjectExport,
} from '../templates/types.js';
import type { ExternalImportProviderEntry } from './build-external-import-providers-map.js';
import type { TsImportProviderNames } from './default-import-providers.js';
import type { TsExtractorConfig } from './ts-extractor-config.schema.js';

import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from '../renderers/file.js';
import { TsCodeUtils, tsTemplate } from '../utils/ts-code-utils.js';
import { getDefaultImportProviderNames } from './default-import-providers.js';

export const GENERATED_IMPORT_PROVIDERS_FILE_NAME = 'ts-import-providers.ts';

interface RenderTsImportProvidersContext {
  generatorPackageName: string;
  pathsRootExportName: string;
  externalImportProvidersMap: Map<string, ExternalImportProviderEntry>;
}

function renderDefaultTsImportProviders(
  importProviderNames: TsImportProviderNames,
  projectExports: Record<string, TsTemplateFileProjectExport>,
  { generatorPackageName }: RenderTsImportProvidersContext,
): TsCodeFragment {
  const typescriptRendererIndex = resolvePackagePathSpecifier(
    `@baseplate-dev/core-generators:src/renderers/typescript/index.ts`,
    generatorPackageName,
  );
  const createImportMapSchema = TsCodeUtils.importFragment(
    'createTsImportMapSchema',
    typescriptRendererIndex,
  );
  const importTemplateSchema = tsTemplate`const ${importProviderNames.providerSchemaName} = ${createImportMapSchema}(
    ${TsCodeUtils.mergeFragmentsAsObject(
      mapValues(projectExports, (projectExport) =>
        JSON.stringify({
          isTypeOnly: projectExport.isTypeOnly ? true : undefined,
          exportedAs: projectExport.exportName ?? undefined,
        } as TsImportMapSchemaEntry),
      ),
    )}
  );
  `;

  const tsImportMapProviderFromSchema = TsCodeUtils.typeImportFragment(
    'TsImportMapProviderFromSchema',
    typescriptRendererIndex,
  );

  const providerTypeFragment = tsTemplate`export type ${importProviderNames.providerTypeName} =
    ${tsImportMapProviderFromSchema}<typeof ${importProviderNames.providerSchemaName}>;
    `;

  const createReadOnlyProviderType = TsCodeUtils.importFragment(
    'createReadOnlyProviderType',
    '@baseplate-dev/sync',
  );

  const providerFragment = tsTemplate`
    export const ${importProviderNames.providerExportName} =
      ${createReadOnlyProviderType}<${importProviderNames.providerTypeName}>(
        ${quot(importProviderNames.providerName)},
      );
    `;

  return TsCodeUtils.mergeFragmentsPresorted(
    [importTemplateSchema, providerTypeFragment, providerFragment],
    '\n\n',
  );
}

function renderCombinedImportProviderTask(
  generatorName: string,
  templates: TemplateExtractorTemplateEntry<TsGeneratorTemplateMetadata>[],
  defaultImportProviderConfig:
    | {
        importProviderNames: TsImportProviderNames;
        projectExports: Record<string, TsTemplateFileProjectExport>;
      }
    | undefined,
  externalImportProviders: ExternalImportProviderEntry[],
  { generatorPackageName, pathsRootExportName }: RenderTsImportProvidersContext,
): { fragment: TsCodeFragment; exportName: string } {
  const typescriptRendererIndex = resolvePackagePathSpecifier(
    `@baseplate-dev/core-generators:src/renderers/typescript/index.ts`,
    generatorPackageName,
  );
  const projectScopeSpecifier = resolvePackagePathSpecifier(
    `@baseplate-dev/core-generators:src/providers/index.ts`,
    generatorPackageName,
  );
  const projectScope = TsCodeUtils.importFragment(
    'projectScope',
    projectScopeSpecifier,
  );
  const createTsImportMap = TsCodeUtils.importFragment(
    'createTsImportMap',
    typescriptRendererIndex,
  );

  const importsTaskName = getGeneratedTemplateExportName(
    generatorName,
    'imports-task',
  );

  const pathsProvider = TsCodeUtils.templateWithImports(
    tsImportBuilder([pathsRootExportName]).from(
      normalizeTsPathToJsPath(`./${GENERATED_PATHS_FILE_NAME}`),
    ),
  )`${pathsRootExportName}.provider`;

  const importProviderExports = new Map<string, TsCodeFragment>();
  const importProviderPathMap = new Map<string, TsCodeFragment>();

  const projectExportsMap = new Map(
    templates.flatMap((template) =>
      Object.keys(template.config.projectExports ?? {}).map((name) => [
        name,
        `paths.${camelCase(template.config.name)}`,
      ]),
    ),
  );

  if (defaultImportProviderConfig) {
    const { importProviderNames, projectExports } = defaultImportProviderConfig;
    const exportKey = importProviderNames.providerExportName.replace(
      /Provider$/,
      '',
    );
    importProviderExports.set(
      exportKey,
      tsTemplate`${importProviderNames.providerExportName}.export(${projectScope})`,
    );
    importProviderPathMap.set(
      exportKey,
      tsTemplate`${createTsImportMap}(${importProviderNames.providerSchemaName}, ${TsCodeUtils.mergeFragmentsAsObject(
        mapValues(projectExports, (projectExport, key) => {
          const path = projectExportsMap.get(key);
          if (!path) {
            throw new Error(
              `Project export ${key} not found in project exports map`,
            );
          }
          return path;
        }),
      )})`,
    );
  }

  for (const externalImportProvider of externalImportProviders) {
    const providerImport = TsCodeUtils.importFragment(
      externalImportProvider.providerExportName,
      resolvePackagePathSpecifier(
        externalImportProvider.packagePathSpecifier,
        generatorPackageName,
      ),
    );
    const providerSchema = TsCodeUtils.importFragment(
      externalImportProvider.importProviderSchemaName,
      resolvePackagePathSpecifier(
        externalImportProvider.packagePathSpecifier,
        generatorPackageName,
      ),
    );

    const exportKey = externalImportProvider.providerExportName.replace(
      /Provider$/,
      '',
    );

    importProviderExports.set(
      exportKey,
      tsTemplate`${providerImport}.export(${projectScope})`,
    );
    importProviderPathMap.set(
      exportKey,
      tsTemplate`${createTsImportMap}(${providerSchema}, ${TsCodeUtils.mergeFragmentsAsObject(
        mapValues(
          externalImportProvider.projectExports,
          (projectExport, key) => {
            const path = projectExportsMap.get(key);
            if (!path) {
              throw new Error(
                `Project export ${key} not found in project exports map`,
              );
            }
            return path;
          },
        ),
      )})`,
    );
  }

  // Build the run function body
  const runFunctionBody: TsCodeFragment = tsTemplate`
    return {
      providers: ${TsCodeUtils.mergeFragmentsAsObject(importProviderPathMap)},
    };
  `;

  // Build exports object
  const exportsObject = TsCodeUtils.mergeFragmentsAsObject(
    importProviderExports,
  );

  const importsTaskFragment = TsCodeUtils.templateWithImports([
    tsImportBuilder(['createGeneratorTask']).from('@baseplate-dev/sync'),
  ])`
    const ${importsTaskName} = createGeneratorTask({
      dependencies: {
        paths: ${pathsProvider},
      },
      exports: ${exportsObject},
      run({ paths }) {
        ${runFunctionBody}
      },
    });
  `;

  return {
    fragment: importsTaskFragment,
    exportName: importsTaskName,
  };
}

/**
 * Renders the generated import map providers.
 *
 * @param generatorName - The name of the generator.
 * @param templates - The template entries for the generator.
 * @param context - The rendering context.
 * @param extractorConfig - The TypeScript extractor configuration.
 * @returns The import map file contents and the project exports.
 */
export function renderTsImportProviders(
  generatorName: string,
  templates: TemplateExtractorTemplateEntry<TsGeneratorTemplateMetadata>[],
  context: RenderTsImportProvidersContext,
  extractorConfig?: TsExtractorConfig,
):
  | {
      contents: string;
      barrelExports: TemplateExtractorBarrelExport[];
      generatorBarrelExports: TemplateExtractorGeneratedBarrelExport[];
    }
  | undefined {
  const importProviderNames = getDefaultImportProviderNames(generatorName);

  const projectExportArray = templates.flatMap((template) =>
    Object.entries(template.config.projectExports ?? {}).map(
      ([name, projectExport]) => ({
        name,
        projectExport,
      }),
    ),
  );

  const externalImportProviders =
    extractorConfig?.importProviders?.map((provider) => {
      const resolvedProvider = context.externalImportProvidersMap.get(provider);
      if (!resolvedProvider) {
        throw new Error(`Import provider ${provider} not found`);
      }
      return resolvedProvider;
    }) ?? [];

  // If skipDefaultImportMap is true and no external import providers, don't generate anything
  if (
    (extractorConfig?.skipDefaultImportMap ||
      projectExportArray.length === 0) &&
    externalImportProviders.length === 0
  ) {
    return;
  }

  // Check for duplicate project exports
  const duplicateProjectExports = projectExportArray.filter(
    (projectExport, index, self) =>
      self.findIndex((t) => t.name === projectExport.name) !== index,
  );

  if (duplicateProjectExports.length > 0) {
    throw new Error(
      `Duplicate project exports found in template files for generator ${generatorName}: ${duplicateProjectExports.map((fileExport) => fileExport.name).join(', ')}`,
    );
  }

  const fragments: TsCodeFragment[] = [];
  const barrelExports: TemplateExtractorBarrelExport[] = [];

  // Render default import providers if not skipped and has project exports
  let defaultImportProviderFragment: TsCodeFragment | undefined;

  const defaultProjectExports = Object.fromEntries(
    projectExportArray
      .filter(
        ({ name }) =>
          !externalImportProviders.some(
            (provider) => name in provider.projectExports,
          ),
      )
      .map(({ name, projectExport }) => [name, projectExport]),
  );

  if (
    extractorConfig?.skipDefaultImportMap &&
    Object.keys(defaultProjectExports).length > 0
  ) {
    throw new Error(
      `Generator ${generatorName} has project exports (${Object.keys(
        defaultProjectExports,
      ).join(', ')}) but skipDefaultImportMap is true`,
    );
  }

  if (
    !extractorConfig?.skipDefaultImportMap &&
    Object.keys(defaultProjectExports).length > 0
  ) {
    defaultImportProviderFragment = renderDefaultTsImportProviders(
      importProviderNames,
      defaultProjectExports,
      context,
    );

    fragments.push(defaultImportProviderFragment);

    // Add barrel exports for default import providers
    barrelExports.push(
      {
        moduleSpecifier: `./generated/${normalizeTsPathToJsPath(
          GENERATED_IMPORT_PROVIDERS_FILE_NAME,
        )}`,
        namedExports: [importProviderNames.providerExportName],
      },
      {
        moduleSpecifier: `./generated/${normalizeTsPathToJsPath(
          GENERATED_IMPORT_PROVIDERS_FILE_NAME,
        )}`,
        namedExports: [importProviderNames.providerTypeName],
        isTypeOnly: true,
      },
    );
  }

  // Create a single combined task that includes both default and existing import providers
  const importsTaskFragment = renderCombinedImportProviderTask(
    generatorName,
    templates,
    defaultImportProviderFragment
      ? {
          importProviderNames,
          projectExports: defaultProjectExports,
        }
      : undefined,
    externalImportProviders,
    context,
  );

  fragments.push(importsTaskFragment.fragment);

  const generatedExportName = getGeneratedTemplateConstantName(
    generatorName,
    'imports',
  );

  const barrelExportFragment = tsTemplate`export const ${generatedExportName} = {
    task: ${importsTaskFragment.exportName},
  };`;

  fragments.push(barrelExportFragment);

  const mergedFragment = TsCodeUtils.mergeFragmentsPresorted(fragments, '\n\n');

  const contents = renderTsCodeFileTemplate({
    templateContents: 'TPL_CONTENTS',
    variables: { TPL_CONTENTS: mergedFragment },
    importMapProviders: {},
    positionedHoistedFragments: [],
    options: {
      importSortOptions: {
        internalPatterns: [/^#src/],
      },
    },
  });

  return {
    contents,
    barrelExports,
    generatorBarrelExports: [
      {
        moduleSpecifier: `./${normalizeTsPathToJsPath(
          GENERATED_IMPORT_PROVIDERS_FILE_NAME,
        )}`,
        namedExport: generatedExportName,
        name: 'imports',
      },
    ],
  };
}
