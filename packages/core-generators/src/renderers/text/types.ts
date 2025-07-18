import type { TemplateFileBase } from '@baseplate-dev/sync';

import { templateConfigSchema } from '@baseplate-dev/sync';
import { z } from 'zod';

import type { TemplateFileOptions } from '../schemas/template-file-options.js';

import { templateFileOptionsSchema } from '../schemas/template-file-options.js';

export const TEXT_TEMPLATE_TYPE = 'text';

const textTemplateFileVariableSchema = z.object({
  // The description of the variable.
  description: z.string().optional(),
});

export const textTemplateMetadataSchema = templateConfigSchema.extend({
  /**
   * The options for the template file
   */
  fileOptions: templateFileOptionsSchema,
  /**
   * The path of the template relative to the closest file path root.
   */
  pathRootRelativePath: z.string().optional(),
  /**
   * The group to assign the template to when generating the typed templates.
   */
  group: z.string().optional(),
  /**
   * The variables for the template.
   */
  variables: z.record(z.string(), textTemplateFileVariableSchema).optional(),
});

export type TextTemplateMetadata = z.infer<typeof textTemplateMetadataSchema>;

export const textTemplateInstanceDataSchema = z.object({
  /**
   * The variables for the template with their values.
   */
  variables: z.record(z.string(), z.string()),
});

export type TextTemplateInstanceData = z.infer<
  typeof textTemplateInstanceDataSchema
>;

/**
 * A variable for a text template.
 */
export type TextTemplateFileVariable = z.infer<
  typeof textTemplateFileVariableSchema
>;

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

export type TextTemplateGroup = Record<string, TextTemplateFile>;

/**
 * Generator template metadata for text templates
 */
export type TextGeneratorTemplateMetadata = z.infer<
  typeof textTemplateMetadataSchema
>;
