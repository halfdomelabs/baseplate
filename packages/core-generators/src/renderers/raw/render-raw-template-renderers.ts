import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync';

import { camelCase } from 'change-case';

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

import type { RawTemplateMetadata } from './types.js';

import { tsImportBuilder } from '../typescript/imports/builder.js';
import {
  TsCodeUtils,
  tsTemplateWithImports,
} from '../typescript/utils/ts-code-utils.js';

interface RenderRawTemplateRenderersContext {
  generatorPackageName: string;
  generatorName: string;
}

function createRawTaskDependencies(
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

function createRawRenderFunctionForTemplate(
  templateName: string,
  templateConfig: RawTemplateMetadata,
  context: RenderRawTemplateRenderersContext,
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
      tsImportBuilder(['RenderRawTemplateFileActionInput'])
        .typeOnly()
        .from(
          resolvePackagePathSpecifier(
            '@baseplate-dev/core-generators:src/renderers/raw/render-raw-template-action.ts',
            context.generatorPackageName,
          ),
        ),
    ])`(options: Omit<RenderRawTemplateFileActionInput<typeof ${
      templateExpression
    }>, ${isSingleton ? "'destination' | " : ''}'template'>) => ${builderActionTypeImport}`,
    renderFunction: tsTemplateWithImports([
      tsImportBuilder(['renderRawTemplateFileAction']).from(
        resolvePackagePathSpecifier(
          '@baseplate-dev/core-generators:src/renderers/raw/render-raw-template-action.ts',
          context.generatorPackageName,
        ),
      ),
    ])`
      (options) => renderRawTemplateFileAction(${TsCodeUtils.mergeFragmentsAsObjectPresorted(
        {
          template: templateExpression,
          destination: isSingleton
            ? `paths.${camelCase(templateName)}`
            : undefined,
          '...': 'options',
        },
      )})
    `,
    taskDependencies: createRawTaskDependencies(
      context.generatorName,
      templateConfig.fileOptions.kind === 'singleton',
    ),
  };
}

export function renderRawTemplateRenderers(
  templates: TemplateExtractorTemplateEntry<RawTemplateMetadata>[],
  context: RenderRawTemplateRenderersContext,
): TemplateRendererEntry[] {
  // Raw templates don't support groups, so we only handle individual templates
  return templates.map((template) =>
    createRawRenderFunctionForTemplate(template.name, template.config, context),
  );
}
