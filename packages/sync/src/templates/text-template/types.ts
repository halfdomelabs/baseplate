import { z } from 'zod';

import type { TemplateFileBase } from '../types.js';

import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';

export const TEXT_TEMPLATE_TYPE = 'text';

export const textTemplateFileMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(TEXT_TEMPLATE_TYPE),
    /**
     * The group of templates that this template belongs to.
     */
    group: z.string().optional(),
    /**
     * The variables for the template.
     */
    variables: z
      .record(
        z.string(),
        z.object({
          // The description of the variable.
          description: z.string().optional(),
          // The value of the variable.
          value: z.string(),
          // Whether the variable is an identifier so we check for non-alphanumeric characters around
          // the variable name.
          isIdentifier: z.boolean().optional(),
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
  /**
   * Whether the variable is an identifier so we check for non-alphanumeric characters around
   * the variable name.
   */
  isIdentifier?: boolean;
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
