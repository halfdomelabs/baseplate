import type { BuilderAction, WriteFileOptions } from '@halfdomelabs/sync';

import path from 'node:path';

import type {
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateGroup,
} from '../templates/types.js';

import { renderTsTemplateFileAction } from './render-ts-template-file-action.js';

type HasVariables<T extends TsTemplateFile> =
  keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? false
    : true;

type InferTsTemplateVariablesFromTemplateGroup<T extends TsTemplateGroup> = {
  [K in keyof T['templates'] as HasVariables<
    T['templates'][K]['template']
  > extends true
    ? K
    : never]: InferTsTemplateVariablesFromMap<
    T['templates'][K]['template']['variables']
  >;
};

interface RenderTsTemplateGroupActionInputBase<T extends TsTemplateGroup> {
  group: T;
  baseDirectory: string;
  options?: {
    [K in keyof T['templates']]?: Omit<WriteFileOptions, 'templateMetadata'>;
  };
  renderOptions: {
    [K in keyof T['templates']]?: Parameters<
      typeof renderTsTemplateFileAction
    >[0]['renderOptions'];
  };
}

type RenderTsTemplateGroupActionInput<
  T extends TsTemplateGroup = TsTemplateGroup,
> = RenderTsTemplateGroupActionInputBase<T> &
  (keyof InferTsTemplateVariablesFromTemplateGroup<T> extends never
    ? Partial<{ variables: InferTsTemplateVariablesFromTemplateGroup<T> }>
    : { variables: InferTsTemplateVariablesFromTemplateGroup<T> });

export function renderTsTemplateGroupAction<
  T extends TsTemplateGroup = TsTemplateGroup,
>({
  group,
  baseDirectory,
  variables,
  options,
  renderOptions,
}: RenderTsTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      for (const [key, template] of Object.entries(group.templates)) {
        const destination = path.join(baseDirectory, template.destination);
        try {
          await builder.apply(
            renderTsTemplateFileAction({
              template: template.template,
              destination,
              variables:
                variables && typeof variables === 'object'
                  ? (variables[key as keyof typeof variables] as Record<
                      never,
                      string
                    >)
                  : undefined,
              options: options?.[key],
              renderOptions: renderOptions[key] ?? { importMapProviders: {} },
            }),
          );
        } catch (error) {
          throw new Error(
            `Failed to render template "${key}": ${String(error)}`,
          );
        }
      }
    },
  };
}
