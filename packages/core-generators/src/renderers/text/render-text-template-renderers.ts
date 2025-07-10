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

import type { TextTemplateMetadata } from './types.js';

import { tsImportBuilder } from '../typescript/imports/builder.js';
import {
  TsCodeUtils,
  tsTemplateWithImports,
} from '../typescript/utils/ts-code-utils.js';

interface RenderTextTemplateRenderersContext {
  generatorPackageName: string;
  generatorName: string;
}

function createTextTaskDependencies(
  generatorName: string,
  usesPaths: boolean,
): TemplateRendererTaskDependency[] {
  const { rootExportName } = getPathsFileExportNames(generatorName);

  return [
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

const builderActionTypeImport = TsCodeUtils.typeImportFragment(
  'BuilderAction',
  '@baseplate-dev/sync',
);

function createTextRenderFunctionForTemplate(
  templateName: string,
  templateConfig: TextTemplateMetadata,
  context: RenderTextTemplateRenderersContext,
): TemplateRendererEntry {
  const isSingleton = templateConfig.fileOptions.kind === 'singleton';
  const typedTemplatesExportName = getTypedTemplatesFileExportName(
    context.generatorName,
  );
  const templateExpression = tsTemplateWithImports(
    tsImportBuilder([typedTemplatesExportName]).from(
      `./${normalizeTsPathToJsPath(GENERATED_TYPED_TEMPLATES_FILE_NAME)}`,
    ),
  )`${typedTemplatesExportName}.${camelCase(templateName)}`;

  return {
    name: camelCase(templateName),
    renderType: tsTemplateWithImports([
      tsImportBuilder(['RenderTextTemplateFileActionInput'])
        .typeOnly()
        .from(
          resolvePackagePathSpecifier(
            '@baseplate-dev/core-generators:src/renderers/text/render-text-template-file-action.ts',
            context.generatorPackageName,
          ),
        ),
    ])`(options: Omit<RenderTextTemplateFileActionInput<typeof ${
      templateExpression
    }>, ${isSingleton ? "'destination' | " : ''}'template'>) => ${builderActionTypeImport}`,
    renderFunction: tsTemplateWithImports([
      tsImportBuilder(['renderTextTemplateFileAction']).from(
        resolvePackagePathSpecifier(
          '@baseplate-dev/core-generators:src/renderers/text/render-text-template-file-action.ts',
          context.generatorPackageName,
        ),
      ),
    ])`
      (options) => renderTextTemplateFileAction(${TsCodeUtils.mergeFragmentsAsObjectPresorted(
        {
          template: templateExpression,
          destination: isSingleton
            ? `paths.${camelCase(templateName)}`
            : undefined,
          '...': 'options',
        },
      )})
    `,
    taskDependencies: createTextTaskDependencies(
      context.generatorName,
      templateConfig.fileOptions.kind === 'singleton',
    ),
  };
}

function createTextRenderFunctionForTemplateGroup(
  groupName: string,
  _templateConfigs: TextTemplateMetadata[],
  context: RenderTextTemplateRenderersContext,
): TemplateRendererEntry {
  const typedTemplatesExportName = getTypedTemplatesFileExportName(
    context.generatorName,
  );
  const templatesExpression = tsTemplateWithImports(
    tsImportBuilder([typedTemplatesExportName]).from(
      `./${normalizeTsPathToJsPath(GENERATED_TYPED_TEMPLATES_FILE_NAME)}`,
    ),
  )`${typedTemplatesExportName}.${camelCase(groupName)}`;

  return {
    name: camelCase(groupName),
    renderType: tsTemplateWithImports([
      tsImportBuilder(['RenderTextTemplateGroupActionInput'])
        .typeOnly()
        .from(
          resolvePackagePathSpecifier(
            '@baseplate-dev/core-generators:src/renderers/text/render-text-template-group-action.ts',
            context.generatorPackageName,
          ),
        ),
    ])`(options: Omit<RenderTextTemplateGroupActionInput<typeof ${templatesExpression}>, 'group' | 'paths'>) => ${builderActionTypeImport}`,
    renderFunction: tsTemplateWithImports([
      tsImportBuilder(['renderTextTemplateGroupAction']).from(
        resolvePackagePathSpecifier(
          '@baseplate-dev/core-generators:src/renderers/text/render-text-template-group-action.ts',
          context.generatorPackageName,
        ),
      ),
    ])`
      (options) => renderTextTemplateGroupAction(${TsCodeUtils.mergeFragmentsAsObjectPresorted(
        {
          group: templatesExpression,
          paths: `paths`,
          '...': 'options',
        },
      )})
    `,
    taskDependencies: createTextTaskDependencies(context.generatorName, true),
  };
}

export function renderTextTemplateRenderers(
  templates: TemplateExtractorTemplateEntry<TextTemplateMetadata>[],
  context: RenderTextTemplateRenderersContext,
): TemplateRendererEntry[] {
  const templatesWithGroup = templates.filter((t) => t.config.group);
  const templatesWithoutGroup = templates.filter((t) => !t.config.group);

  const templateGroups = groupBy(
    templatesWithGroup,
    (t) => t.config.group ?? '',
  );

  return [
    ...Object.entries(templateGroups).map(([groupName, templates]) =>
      createTextRenderFunctionForTemplateGroup(
        `${groupName}Group`,
        templates.map((t) => t.config),
        context,
      ),
    ),
    ...templatesWithoutGroup.map((template) =>
      createTextRenderFunctionForTemplate(
        template.name,
        template.config,
        context,
      ),
    ),
  ];
}
