import { mapValues } from 'es-toolkit';

import type { BuilderAction } from '@src/output/builder-action.js';
import type { WriteFileOptions } from '@src/output/generator-task-output.js';

import type {
  InferTextTemplateVariablesFromTemplate,
  TextTemplateFile,
  TextTemplateFileMetadata,
  TextTemplateFileVariable,
} from './types.js';

import { readTemplateFileSource } from '../utils.js';
import { TEXT_TEMPLATE_TYPE } from './types.js';

interface RenderTextTemplateFileActionInputBase<T extends TextTemplateFile> {
  template: T;
  id: string;
  destination: string;
  options?: Omit<WriteFileOptions, 'templateMetadata'>;
}

type RenderTextTemplateFileActionInput<
  T extends TextTemplateFile = TextTemplateFile,
> = RenderTextTemplateFileActionInputBase<T> &
  (keyof InferTextTemplateVariablesFromTemplate<T> extends never
    ? Partial<{ variables: InferTextTemplateVariablesFromTemplate<T> }>
    : { variables: InferTextTemplateVariablesFromTemplate<T> });

export function renderTextTemplateFileAction<
  T extends TextTemplateFile = TextTemplateFile,
>({
  template,
  id,
  destination,
  options,
  variables,
}: RenderTextTemplateFileActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      let renderedTemplate = await readTemplateFileSource(
        builder.generatorInfo.baseDirectory,
        template.source,
      );

      const variablesObj = variables as
        | Record<string, string | undefined>
        | undefined;

      if (variablesObj && Object.keys(variablesObj).length > 0) {
        // make sure all variables begin with TPL_
        const invalidVariableKey = Object.keys(variablesObj).find(
          (key) => !key.startsWith('TPL_'),
        );
        if (invalidVariableKey) {
          throw new Error(
            `Template variable must start with TPL_: ${invalidVariableKey}`,
          );
        }
        const missingTemplateVariableKey = Object.keys(template.variables).find(
          (key) => !renderedTemplate.includes(`{{${key}}}`),
        );
        if (missingTemplateVariableKey) {
          throw new Error(
            `Template variable not found in template: ${missingTemplateVariableKey} (template: ${JSON.stringify(template.source)})`,
          );
        }

        // This validation ensures that the template extractor can correctly identify variable placeholders.
        // If a variable value already exists in the template, it could lead to incorrect extraction because
        // the system wouldn't be able to distinguish between the original text and the replaced variables.

        const invalidVariableValue = Object.values(variablesObj).find(
          (val) => val !== undefined && renderedTemplate.includes(val),
        );
        if (invalidVariableValue) {
          throw new Error(
            `The pre-rendered template contains the value of a template variable (${invalidVariableValue}) which would prevent
            template extraction from working correctly. Please ensure that no template variables values
            are present in the original template file. ${JSON.stringify(template.source)}`,
          );
        }

        renderedTemplate = renderedTemplate.replaceAll(
          new RegExp(/{{TPL_[A-Z0-9_]+}}/g),
          (match) => {
            const key = match.slice(2, -2);
            const value = variablesObj[key];
            if (value === undefined) {
              throw new Error(`Template variable not found: ${key}`);
            }

            return value;
          },
        );
      }

      const templateVariables = template.variables as Record<
        string,
        TextTemplateFileVariable
      >;

      const templateMetadata: TextTemplateFileMetadata | undefined =
        'path' in template.source
          ? {
              name: template.name,
              template: template.source.path,
              generator: builder.generatorInfo.name,
              type: TEXT_TEMPLATE_TYPE,
              variables: mapValues(templateVariables, (val, key) => ({
                description: val.description,
                value: (variables as Record<string, string>)[key],
              })),
            }
          : undefined;

      builder.writeFile({
        id,
        filePath: destination,
        contents: renderedTemplate,
        options,
        templateMetadata,
      });
    },
  };
}
