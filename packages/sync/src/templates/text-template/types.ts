import { z } from 'zod';

import type { TemplateFileBase } from '../types.js';

import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';

export const TEXT_TEMPLATE_TYPE = 'text';

export const textTemplateFileMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(TEXT_TEMPLATE_TYPE),
    variables: z
      .record(
        z.string(),
        z.object({
          description: z.string().optional(),
          value: z.string(),
        }),
      )
      .optional(),
  });

export type TextTemplateFileMetadata = z.infer<
  typeof textTemplateFileMetadataSchema
>;

/**
 * A variable for a text template.
 */
export interface TextTemplateFileVariable {
  /**
   * A description of the variable.
   */
  description?: string;
}

/**
 * A template for a text file with replacements.
 */
export interface TextTemplateFile<
  T extends Record<string, TextTemplateFileVariable> = Record<
    never,
    TextTemplateFileVariable
  >,
> extends TemplateFileBase {
  /**
   * Variables to be replaced in the template
   */
  variables: T;
}

export function createTextTemplateFile<
  T extends Record<string, TextTemplateFileVariable>,
>(template: TextTemplateFile<T>): TextTemplateFile<T> {
  return template;
}

export type InferTextTemplateVariablesFromTemplate<T extends TextTemplateFile> =
  {
    [K in keyof T['variables']]: string;
  };
