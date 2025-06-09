import type { BuilderAction, WriteFileOptions } from '@baseplate-dev/sync';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';

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
    [K in keyof T as HasVariables<T[K]> extends true
      ? K
      : never]: InferTextTemplateVariablesFromTemplate<T[K]>;
  };

interface RenderTextTemplateGroupActionInputBase<T extends TextTemplateGroup> {
  group: T;
  paths: {
    [K in keyof T]: string;
  };
  options?: {
    [K in keyof T]?: Omit<WriteFileOptions, 'templateMetadata'>;
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
  paths,
  variables,
  options,
}: RenderTextTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      for (const [key, template] of Object.entries(group)) {
        const destination = paths[key];
        try {
          await builder.apply(
            renderTextTemplateFileAction({
              template,
              destination,
              variables:
                variables && typeof variables === 'object'
                  ? (variables[key as keyof typeof variables] as Record<
                      never,
                      string
                    >)
                  : undefined,
              options: options?.[key],
            }),
          );
        } catch (error) {
          throw enhanceErrorWithContext(
            error,
            `Failed to render template "${key}"`,
          );
        }
      }
    },
  };
}
