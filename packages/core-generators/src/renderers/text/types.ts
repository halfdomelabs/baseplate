import type { TemplateFileBase } from '@baseplate-dev/sync';

import { templateFileMetadataBaseSchema } from '@baseplate-dev/sync';
import { templateConfigSchema } from '@baseplate-dev/sync/extractor-v2';
import { z } from 'zod';

import type { TemplateFileOptions } from '../schemas/template-file-options.js';

import { templateFileOptionsSchema } from '../schemas/template-file-options.js';

export const TEXT_TEMPLATE_TYPE = 'text';

const textTemplateFileVariableSchema = z.object({
  // The description of the variable.
  description: z.string().optional(),
  // Whether the variable is an identifier so we check for non-alphanumeric characters around
  isIdentifier: z.boolean().optional(),
});

export const textTemplateGeneratorTemplateMetadataSchema =
  templateConfigSchema.extend({
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The path of the template relative to the closest file path root.
     */
    pathRootRelativePath: z.string().optional(),
    /**
     * The variables for the template.
     */
    variables: z.record(z.string(), textTemplateFileVariableSchema).optional(),
  });

export const textTemplateOutputTemplateMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    /**
     * The type of the template (always `text`)
     */
    type: z.literal(TEXT_TEMPLATE_TYPE),
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The variables for the template with their values.
     */
    variables: z
      .record(
        z.string(),
        textTemplateFileVariableSchema.extend({
          // The value of the variable.
          value: z.string(),
        }),
      )
      .optional(),
  });

/**
 * Metadata for a text template file
 */
export type TextTemplateOutputTemplateMetadata = z.infer<
  typeof textTemplateOutputTemplateMetadataSchema
>;

/**
 * A variable for a text template.
 */
export type TextTemplateFileVariable = z.infer<
  typeof textTemplateFileVariableSchema
>;

/**
 * A variable for a text template with a value.
 */
export type TextTemplateFileVariableWithValue = TextTemplateFileVariable & {
  value: string;
};

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
  /**
   * The options for the template file
   */
  fileOptions: TemplateFileOptions;
}

/**
 * Create a text template file
 */
export function createTextTemplateFile<
  T extends Record<string, TextTemplateFileVariable>,
>(template: TextTemplateFile<T>): TextTemplateFile<T> {
  return template;
}

export type InferTextTemplateVariablesFromTemplate<T extends TextTemplateFile> =
  {
    [K in keyof T['variables']]: string;
  };

interface TextTemplateGroupEntry {
  destination: string;
  template: TextTemplateFile;
}

/**
 * A group of text template files.
 */
export interface TextTemplateGroup<
  T extends Record<string, TextTemplateGroupEntry> = Record<
    string,
    TextTemplateGroupEntry
  >,
> {
  /**
   * The templates in the group.
   */
  templates: T;
}

export function createTextTemplateGroup<
  T extends Record<string, TextTemplateGroupEntry>,
>(group: TextTemplateGroup<T>): TextTemplateGroup<T> {
  return group;
}
