import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync';

import { camelCase } from 'change-case';
import { groupBy } from 'es-toolkit';

import type {
  TemplateRendererEntry,
  TemplateRendererTaskDependency,
} from '#src/renderers/extractor/plugins/template-renderers/types.js';

import {
  GENERATED_PATHS_FILE_NAME,
  getPathsFileExportNames,
} from '#src/renderers/extractor/plugins/template-paths/paths-file.js';
import {
  GENERATED_TYPED_TEMPLATES_FILE_NAME,
  getTypedTemplatesFileExportName,
} from '#src/renderers/extractor/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '#src/renderers/extractor/utils/index.js';
import { normalizeTsPathToJsPath } from '#src/utils/ts-paths.js';

import type { TsTemplateMetadata } from '../templates/types.js';

import { tsImportBuilder } from '../imports/builder.js';
import {
  TsCodeUtils,
  tsTemplate,
  tsTemplateWithImports,
} from '../utils/ts-code-utils.js';

interface RenderTsTemplateRenderersContext {
  generatorPackageName: string;
  generatorName: string;
}

function getImportMapProvidersExpression(
  templateConfigOrConfigs: TsTemplateMetadata | TsTemplateMetadata[],
): string | undefined {
  const templateConfigs = Array.isArray(templateConfigOrConfigs)
    ? templateConfigOrConfigs
    : [templateConfigOrConfigs];
  const providers = templateConfigs.flatMap((t) =>
    Object.keys(t.importMapProviders ?? {}),
  );
  if (providers.length === 0) return;

  return `{
    ${[...new Set(providers.map((p) => p.replace(/Provider$/, '')))].sort().join(', ')}
  }`;
}

function createTypeScriptTaskDependencies(
  generatorName: string,
  generatorPackageName: string,
  usesPaths: boolean,
): TemplateRendererTaskDependency[] {
  const { rootExportName } = getPathsFileExportNames(generatorName);

  return [
    {
      name: 'typescriptFile',
      providerImportName: 'typescriptFileProvider',
      providerImportSpecifier: resolvePackagePathSpecifier(
        '@baseplate-dev/core-generators:src/generators/node/typescript/typescript.generator.ts',
        generatorPackageName,
      ),
    },
    usesPaths
      ? {
          name: 'paths',
          providerExpression: `${rootExportName}.provider`,
          providerImportName: rootExportName,
          providerImportSpecifier: normalizeTsPathToJsPath(
            `./${GENERATED_PATHS_FILE_NAME}`,
          ),
        }
      : undefined,
  ].filter((x) => x !== undefined);
}

function createImportProviderTaskDependencies(
  templateConfig: TsTemplateMetadata,
  context: RenderTsTemplateRenderersContext,
): TemplateRendererTaskDependency[] {
  return Object.entries(templateConfig.importMapProviders ?? {}).map(
    ([name, value]) => ({
      name: name.replace(/Provider$/, ''),
      providerImportName: value.importName,
      providerImportSpecifier: resolvePackagePathSpecifier(
        value.packagePathSpecifier,
        context.generatorPackageName,
      ),
    }),
  );
}

const builderActionTypeImport = TsCodeUtils.typeImportFragment(
  'BuilderAction',
  '@baseplate-dev/sync',
);

function createTypeScriptRenderFunctionForTemplate(
  templateName: string,
  templateConfig: TsTemplateMetadata,
  context: RenderTsTemplateRenderersContext,
): TemplateRendererEntry {
  const importMapProvidersExpression =
    getImportMapProvidersExpression(templateConfig);
  const isSingleton = templateConfig.fileOptions.kind === 'singleton';
  const typedTemplatesExportName = getTypedTemplatesFileExportName(
    context.generatorName,
  );
  const templateExpression = tsTemplateWithImports(
    tsImportBuilder([typedTemplatesExportName]).from(
      `./${normalizeTsPathToJsPath(GENERATED_TYPED_TEMPLATES_FILE_NAME)}`,
    ),
  )`${typedTemplatesExportName}.${camelCase(templateName)}`;

  const usesGeneratorPaths = !!(
    templateConfig.referencedGeneratorTemplates &&
    templateConfig.referencedGeneratorTemplates.length > 0
  );

  return {
    name: camelCase(templateName),
    renderType: tsTemplateWithImports([
      tsImportBuilder(['RenderTsTemplateFileActionInput'])
        .typeOnly()
        .from(
          resolvePackagePathSpecifier(
            '@baseplate-dev/core-generators:src/renderers/typescript/actions/render-ts-template-file-action.ts',
            context.generatorPackageName,
          ),
        ),
    ])`(options: Omit<RenderTsTemplateFileActionInput<typeof ${
      templateExpression
    }>, ${isSingleton ? "'destination' | " : ''}'importMapProviders' | 'template' | 'generatorPaths'>) => ${builderActionTypeImport}`,
    renderFunction: tsTemplate`
      (options) => typescriptFile.renderTemplateFile(${TsCodeUtils.mergeFragmentsAsObjectPresorted(
        {
          template: templateExpression,
          destination: isSingleton
            ? `paths.${camelCase(templateName)}`
            : undefined,
          importMapProviders: importMapProvidersExpression,
          generatorPaths: usesGeneratorPaths ? 'paths' : undefined,
          '...': 'options',
        },
      )})
    `,
    taskDependencies: [
      ...createTypeScriptTaskDependencies(
        context.generatorName,
        context.generatorPackageName,
        templateConfig.fileOptions.kind === 'singleton' || usesGeneratorPaths,
      ),
      ...createImportProviderTaskDependencies(templateConfig, context),
    ],
  };
}

function createTypeScriptRenderFunctionForTemplateGroup(
  groupName: string,
  templateConfigs: TsTemplateMetadata[],
  context: RenderTsTemplateRenderersContext,
): TemplateRendererEntry {
  const typedTemplatesExportName = getTypedTemplatesFileExportName(
    context.generatorName,
  );
  const templatesExpression = tsTemplateWithImports(
    tsImportBuilder([typedTemplatesExportName]).from(
      `./${normalizeTsPathToJsPath(GENERATED_TYPED_TEMPLATES_FILE_NAME)}`,
    ),
  )`${typedTemplatesExportName}.${camelCase(groupName)}`;

  const usesGeneratorPaths = !!templateConfigs.some(
    (t) =>
      t.referencedGeneratorTemplates &&
      t.referencedGeneratorTemplates.length > 0,
  );

  return {
    name: camelCase(groupName),
    renderType: tsTemplateWithImports([
      tsImportBuilder(['RenderTsTemplateGroupActionInput'])
        .typeOnly()
        .from(
          resolvePackagePathSpecifier(
            '@baseplate-dev/core-generators:src/renderers/typescript/actions/render-ts-template-group-action.ts',
            context.generatorPackageName,
          ),
        ),
    ])`(options: Omit<RenderTsTemplateGroupActionInput<typeof ${templatesExpression}>, 'importMapProviders' | 'group' | 'paths' | 'generatorPaths'>) => ${builderActionTypeImport}`,
    renderFunction: tsTemplate`
      (options) => typescriptFile.renderTemplateGroup(${TsCodeUtils.mergeFragmentsAsObjectPresorted(
        {
          group: templatesExpression,
          paths: `paths`,
          importMapProviders: getImportMapProvidersExpression(templateConfigs),
          generatorPaths: usesGeneratorPaths ? 'paths' : undefined,
          '...': 'options',
        },
      )})
    `,
    taskDependencies: [
      ...createTypeScriptTaskDependencies(
        context.generatorName,
        context.generatorPackageName,
        true,
      ),
      ...templateConfigs.flatMap((templateConfig) =>
        createImportProviderTaskDependencies(templateConfig, context),
      ),
    ],
  };
}

export function renderTsTemplateRenderers(
  templates: TemplateExtractorTemplateEntry<TsTemplateMetadata>[],
  context: RenderTsTemplateRenderersContext,
): TemplateRendererEntry[] {
  const templatesWithGroup = templates.filter((t) => t.config.group);
  const templatesWithoutGroup = templates.filter((t) => !t.config.group);

  const templateGroups = groupBy(
    templatesWithGroup,
    (t) => t.config.group ?? '',
  );

  return [
    ...Object.entries(templateGroups).map(([groupName, templates]) =>
      createTypeScriptRenderFunctionForTemplateGroup(
        `${groupName}Group`,
        templates.map((t) => t.config),
        context,
      ),
    ),
    ...templatesWithoutGroup.map((template) =>
      createTypeScriptRenderFunctionForTemplate(
        template.name,
        template.config,
        context,
      ),
    ),
  ];
}
