import path from 'node:path';

import type { BuilderAction } from '@src/output/builder-action.js';
import type { WriteFileOptions } from '@src/output/generator-task-output.js';

import type {
  InferTextTemplateVariablesFromTemplate,
  TextTemplateFile,
  TextTemplateGroup,
} from './types.js';

import { renderTextTemplateFileAction } from './render-text-template-file-action.js';

type HasVariables<T extends TextTemplateFile> =
  keyof InferTextTemplateVariablesFromTemplate<T> extends never ? false : true;

type InferTextTemplateVariablesFromTemplateGroup<T extends TextTemplateGroup> =
  {
    [K in keyof T['templates'] as HasVariables<
      T['templates'][K]['template']
    > extends true
      ? K
      : never]: InferTextTemplateVariablesFromTemplate<
      T['templates'][K]['template']
    >;
  };

interface RenderTextTemplateGroupActionInputBase<T extends TextTemplateGroup> {
  group: T;
  baseDirectory: string;
  options?: {
    [K in keyof T['templates']]?: Omit<WriteFileOptions, 'templateMetadata'>;
  };
}

type RenderTextTemplateGroupActionInput<
  T extends TextTemplateGroup = TextTemplateGroup,
> = RenderTextTemplateGroupActionInputBase<T> &
  (keyof InferTextTemplateVariablesFromTemplateGroup<T> extends never
    ? Partial<{ variables: InferTextTemplateVariablesFromTemplateGroup<T> }>
    : { variables: InferTextTemplateVariablesFromTemplateGroup<T> });

export function renderTextTemplateGroupAction<
  T extends TextTemplateGroup = TextTemplateGroup,
>({
  group,
  baseDirectory,
  variables,
  options,
}: RenderTextTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      for (const [key, template] of Object.entries(group.templates)) {
        const destination = path.join(baseDirectory, template.destination);
        try {
          await builder.apply(
            renderTextTemplateFileAction({
              template: template.template,
              destination,
              variables:
                variables && typeof variables === 'object'
                  ? variables[key as keyof typeof variables]
                  : undefined,
              options: options?.[key],
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
