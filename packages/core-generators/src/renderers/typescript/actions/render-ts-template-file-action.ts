import type { BuilderAction, WriteFileOptions } from '@halfdomelabs/sync';

import { readTemplateFileSource } from '@halfdomelabs/sync';
import { mapValues } from 'es-toolkit';

import type {
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateFileMetadata,
  TsTemplateVariable,
} from '../templates/types.js';

import {
  renderTsCodeFileTemplate,
  type RenderTsCodeFileTemplateOptions,
} from '../renderers/file.js';
import { TS_TEMPLATE_TYPE } from '../templates/types.js';

interface RenderTsTemplateFileActionInputBase<T extends TsTemplateFile> {
  template: T;
  id?: string;
  destination: string;
  options?: Omit<WriteFileOptions, 'templateMetadata'>;
  renderOptions: RenderTsCodeFileTemplateOptions<T['importMapProviders']>;
}

export type RenderTsTemplateFileActionInput<
  T extends TsTemplateFile = TsTemplateFile,
> = RenderTsTemplateFileActionInputBase<T> &
  (keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? Partial<{ variables: InferTsTemplateVariablesFromMap<T['variables']> }>
    : { variables: InferTsTemplateVariablesFromMap<T['variables']> });

export function renderTsTemplateFileAction<
  T extends TsTemplateFile = TsTemplateFile,
>({
  template,
  id,
  destination,
  options,
  variables,
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
      const templateVariableKeys = Object.keys(templateVariables);
      const variableKeys = Object.keys(variableValues);
      if (templateVariableKeys.length !== variableKeys.length) {
        throw new Error(
          `Template variables and provided variables do not match: ${templateVariableKeys.join(
            ', ',
          )} !== ${variableKeys.join(', ')}`,
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
            }
          : undefined;

      const renderedTemplate = renderTsCodeFileTemplate(
        templateContents,
        variableValues,
        {
          ...renderOptions,
          prefix,
        } as RenderTsCodeFileTemplateOptions<never>,
      );

      builder.writeFile({
        id: id ?? template.name,
        destination,
        contents: renderedTemplate,
        options,
        templateMetadata,
      });
    },
  };
}
