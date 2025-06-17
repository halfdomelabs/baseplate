import type { BuilderAction, WriteFileOptions } from '@baseplate-dev/sync';

import { readTemplateFileSource } from '@baseplate-dev/sync';
import { escapeRegExp, mapValues } from 'es-toolkit';

import type {
  InferTextTemplateVariablesFromTemplate,
  TextTemplateFile,
  TextTemplateFileVariable,
  TextTemplateOutputTemplateMetadata,
} from './types.js';

import { TEXT_TEMPLATE_TYPE } from './types.js';
import {
  getTextTemplateDelimiters,
  getTextTemplateVariableRegExp,
} from './utils.js';

interface RenderTextTemplateFileActionInputBase<T extends TextTemplateFile> {
  template: T;
  id?: string;
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
      let templateContents = await readTemplateFileSource(template.source);

      const variablesObj = variables as
        | Record<string, string | undefined>
        | undefined;

      const { start: startDelimiter, end: endDelimiter } =
        getTextTemplateDelimiters(destination);

      if (template.fileOptions.kind === 'instance' && !id) {
        throw new Error('Instance template must have an id');
      }

      const fileId = id ?? template.name;

      const shouldWriteMetadata =
        builder.metadataOptions.includeTemplateMetadata &&
        builder.metadataOptions.shouldGenerateMetadata({
          fileId,
          filePath: destination,
          generatorName: builder.generatorInfo.name,
          isInstance: template.fileOptions.kind === 'instance',
        });

      const templateVariables = template.variables as Record<
        string,
        TextTemplateFileVariable
      >;

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
          (key) =>
            !templateContents.includes(
              `${startDelimiter}${key}${endDelimiter}`,
            ),
        );
        if (missingTemplateVariableKey) {
          throw new Error(
            `Template variable not found in template: ${missingTemplateVariableKey} (template: ${JSON.stringify(template.source)})`,
          );
        }

        // This validation ensures that the template extractor can correctly identify variable placeholders.
        // If a variable value already exists in the template, it could lead to incorrect extraction because
        // the system wouldn't be able to distinguish between the original text and the replaced variables.

        const invalidVariableValue = Object.entries(variablesObj).find(
          ([, val]) => {
            if (val === undefined) return false;
            const variableRegex = getTextTemplateVariableRegExp(val);
            return variableRegex.test(templateContents);
          },
        );
        if (invalidVariableValue && shouldWriteMetadata) {
          throw new Error(
            `The template contents contain the value of a template variable (${invalidVariableValue[1]}) which would prevent ` +
              'template extraction from working correctly. Please ensure that no template variables values ' +
              `are present in the original template file. ${JSON.stringify(template.source)}`,
          );
        }

        // make sure all variables have values
        const missingVariableValue = Object.keys(variablesObj).find(
          (key) => variablesObj[key] === '',
        );
        if (missingVariableValue && shouldWriteMetadata) {
          throw new Error(
            `Template variable is empty: ${missingVariableValue}. All template variables must have a value when metadata is included.`,
          );
        }

        templateContents = templateContents.replaceAll(
          new RegExp(
            `${escapeRegExp(startDelimiter)}TPL_[A-Z0-9_]+${escapeRegExp(
              endDelimiter,
            )}`,
            'g',
          ),
          (match) => {
            const key = match.slice(
              startDelimiter.length,
              endDelimiter === '' ? undefined : -endDelimiter.length,
            );
            const value = variablesObj[key];
            if (value === undefined) {
              throw new Error(`Template variable not found: ${key}`);
            }

            return value;
          },
        );
      }

      const templateMetadata: TextTemplateOutputTemplateMetadata | undefined =
        'path' in template.source
          ? {
              name: template.name,
              generator: builder.generatorInfo.name,
              group: template.group,
              type: TEXT_TEMPLATE_TYPE,
              fileOptions: template.fileOptions,
              variables:
                Object.keys(templateVariables).length > 0
                  ? mapValues(templateVariables, (val, key) => ({
                      ...val,
                      value: (variables as Record<string, string>)[key],
                    }))
                  : undefined,
            }
          : undefined;

      builder.writeFile({
        id: fileId,
        destination,
        contents: templateContents,
        options,
        templateMetadata: shouldWriteMetadata ? templateMetadata : undefined,
      });
    },
  };
}
