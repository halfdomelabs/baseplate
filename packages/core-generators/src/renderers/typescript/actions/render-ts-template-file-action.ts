import type { BuilderAction, WriteFileOptions } from '@halfdomelabs/sync';

import { readTemplateFileSource } from '@halfdomelabs/sync';
import { mapValues } from 'es-toolkit';

import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';
import type {
  InferImportMapProvidersFromProviderTypeMap,
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateFileMetadata,
  TsTemplateVariable,
} from '../templates/types.js';

import { renderTsCodeFileTemplate } from '../renderers/file.js';
import { TS_TEMPLATE_TYPE } from '../templates/types.js';

interface RenderTsTemplateFileActionInputBase<T extends TsTemplateFile> {
  template: T;
  id?: string;
  destination: string;
  writeOptions?: Omit<WriteFileOptions, 'templateMetadata'>;
  renderOptions?: Omit<
    RenderTsCodeFileTemplateOptions,
    'prefix' | 'includeMetadata'
  >;
}

type RenderTsTemplateFileActionVariablesInput<T extends TsTemplateFile> =
  keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? Partial<{ variables: InferTsTemplateVariablesFromMap<T['variables']> }>
    : { variables: InferTsTemplateVariablesFromMap<T['variables']> };

type RenderTsTemplateFileActionImportMapProvidersInput<
  T extends TsTemplateFile,
> = keyof T['importMapProviders'] extends never
  ? Partial<{
      importMapProviders: InferImportMapProvidersFromProviderTypeMap<
        T['importMapProviders']
      >;
    }>
  : {
      importMapProviders: InferImportMapProvidersFromProviderTypeMap<
        T['importMapProviders']
      >;
    };

export type RenderTsTemplateFileActionInput<
  T extends TsTemplateFile = TsTemplateFile,
> = RenderTsTemplateFileActionInputBase<T> &
  RenderTsTemplateFileActionVariablesInput<T> &
  RenderTsTemplateFileActionImportMapProvidersInput<T>;

export function renderTsTemplateFileAction<
  T extends TsTemplateFile = TsTemplateFile,
>({
  template,
  id,
  destination,
  writeOptions,
  variables,
  importMapProviders,
  renderOptions,
}: RenderTsTemplateFileActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      const templateContents = await readTemplateFileSource(
        builder.generatorInfo.baseDirectory,
        template.source,
      );
      const prefix = template.prefix ?? 'TPL_';
      const variableValues = variables ?? {};

      // make sure variables and template variables match keys
      const templateVariables = template.variables as Record<
        string,
        TsTemplateVariable
      >;
      const templateKeySet = new Set(Object.keys(templateVariables));
      const providedKeySet = new Set(Object.keys(variableValues));
      if (
        templateKeySet.size !== providedKeySet.size ||
        [...templateKeySet].some((k) => !providedKeySet.has(k))
      ) {
        throw new Error(
          `Template variables and provided variables do not match: ${[
            ...templateKeySet,
          ].join(', ')} !== ${[...providedKeySet].join(', ')}`,
        );
      }

      const templateMetadata: TsTemplateFileMetadata | undefined =
        'path' in template.source
          ? {
              name: template.name,
              template: template.source.path,
              generator: builder.generatorInfo.name,
              group: template.group,
              type: TS_TEMPLATE_TYPE,
              variables:
                Object.keys(templateVariables).length > 0
                  ? mapValues(templateVariables, (val) => ({
                      description: val.description,
                    }))
                  : undefined,
              projectExports:
                Object.keys(template.projectExports ?? {}).length > 0
                  ? template.projectExports
                  : undefined,
            }
          : undefined;

      const renderedTemplate = renderTsCodeFileTemplate(
        templateContents,
        variableValues,
        importMapProviders,
        {
          ...renderOptions,
          includeMetadata: builder.includeMetadata,
          prefix,
        },
      );

      builder.writeFile({
        id: id ?? template.name,
        destination,
        contents: renderedTemplate,
        options: writeOptions,
        templateMetadata,
      });
    },
  };
}
