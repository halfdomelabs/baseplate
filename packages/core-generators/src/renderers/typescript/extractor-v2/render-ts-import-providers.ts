import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync/extractor-v2';

import { quot } from '@baseplate-dev/utils';
import { camelCase } from 'change-case';
import { mapValues } from 'es-toolkit';

import {
  getGeneratedTemplateExportName,
  resolvePackagePathSpecifier,
} from '#src/renderers/templates/index.js';
import { GENERATED_PATHS_FILE_NAME } from '#src/renderers/templates/plugins/template-paths/paths-file.js';

import type { TsCodeFragment } from '../fragments/types.js';
import type {
  TsGeneratorTemplateMetadata,
  TsTemplateFileProjectExport,
} from '../templates/types.js';
import type { TsImportProviderNames } from './default-import-providers.js';

import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from '../renderers/file.js';
import { TsCodeUtils, tsTemplate } from '../utils/ts-code-utils.js';
import { getDefaultImportProviderNames } from './default-import-providers.js';

export const GENERATED_IMPORT_PROVIDERS_PATH =
  'generated/ts-import-providers.ts';

interface RenderTsImportProvidersContext {
  generatorPackageName: string;
  pathsRootExportName: string;
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
          name: projectExport.exportName ?? undefined,
        }),
      ),
    )}
  );
  `;

  const tsImportMapProviderFromSchema = TsCodeUtils.importFragment(
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

function renderTsImportProviderTask(
  generatorName: string,
  templates: TemplateExtractorTemplateEntry<TsGeneratorTemplateMetadata>[],
  importsProvider: TsCodeFragment,
  { pathsRootExportName }: RenderTsImportProvidersContext,
): TsCodeFragment {
  const importsTaskName = getGeneratedTemplateExportName(
    generatorName,
    'imports-task',
  );

  const projectExportToPathMap = Object.fromEntries(
    templates.flatMap((template) =>
      Object.keys(template.config.projectExports ?? {}).map((name) => [
        name,
        `pathMap.${camelCase(template.config.name)}`,
      ]),
    ),
  );

  const importMap = TsCodeUtils.mergeFragmentsAsObject(projectExportToPathMap);

  const pathsProvider = TsCodeUtils.templateWithImports(
    tsImportBuilder([pathsRootExportName]).from(
      `./${GENERATED_PATHS_FILE_NAME}`,
    ),
  )`${pathsRootExportName}.provider`;

  const importsTaskFragment = TsCodeUtils.templateWithImports([
    tsImportBuilder(['createGeneratorTask']).from('@baseplate-dev/sync'),
  ])`
    export const ${importsTaskName} = createGeneratorTask({
      dependencies: {
        paths: ${pathsProvider},
      },
      exports: {
        imports: ${importsProvider}.export(),
      },
      run({ paths }) {
        return {
          providers: {
            imports: ${importMap},
          },
        };
      },
    });
  `;

  return importsTaskFragment;
}

/**
 * Renders the generated import map providers.
 *
 * @param generatorName - The name of the generator.
 * @returns The import map file contents and the project exports.
 */
export function renderTsImportProviders(
  generatorName: string,
  templates: TemplateExtractorTemplateEntry<TsGeneratorTemplateMetadata>[],
  context: RenderTsImportProvidersContext,
): string | undefined {
  const importProviderNames = getDefaultImportProviderNames(generatorName);

  const projectExportArray = templates.flatMap((template) =>
    Object.entries(template.config.projectExports ?? {}).map(
      ([name, projectExport]) => ({
        name,
        projectExport,
      }),
    ),
  );

  if (projectExportArray.length === 0) {
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

  const projectExports = Object.fromEntries(
    projectExportArray.map(({ name, projectExport }) => [name, projectExport]),
  );

  const defaultTsImportProvidersFragment = renderDefaultTsImportProviders(
    importProviderNames,
    projectExports,
    context,
  );

  const importsTaskFragment = renderTsImportProviderTask(
    generatorName,
    templates,
    defaultTsImportProvidersFragment,
    context,
  );

  const mergedFragment = TsCodeUtils.mergeFragmentsPresorted(
    [defaultTsImportProvidersFragment, importsTaskFragment],
    '\n\n',
  );

  return renderTsCodeFileTemplate({
    templateContents: 'TPL_CONTENTS',
    variables: { TPL_CONTENTS: mergedFragment },
    importMapProviders: {},
    positionedHoistedFragments: [],
  });
}
