import type { TemplateFileBase } from '@baseplate-dev/sync';

import { templateConfigSchema } from '@baseplate-dev/sync';
import { z } from 'zod';

import type { TemplateFileOptions } from '../schemas/template-file-options.js';

import { templateFileOptionsSchema } from '../schemas/template-file-options.js';

export const RAW_TEMPLATE_TYPE = 'raw';

export const rawTemplateMetadataSchema = templateConfigSchema.extend({
  /**
   * The options for the template file
   */
  fileOptions: templateFileOptionsSchema,
  /**
   * The path of the template relative to the closest file path root.
   */
  pathRootRelativePath: z.string().optional(),
});

export type RawTemplateMetadata = z.infer<typeof rawTemplateMetadataSchema>;

/**
 * A template for a raw file with no replacements.
 */
export interface RawTemplateFile<
  TFileOptions extends TemplateFileOptions = TemplateFileOptions,
> extends TemplateFileBase {
  fileOptions: TFileOptions;
}

/**
 * Create a raw template file
 */
export function createRawTemplateFile<TFileOptions extends TemplateFileOptions>(
  templateFile: RawTemplateFile<TFileOptions>,
): RawTemplateFile<TFileOptions> {
  return templateFile;
}
