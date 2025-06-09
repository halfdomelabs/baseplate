import type { TemplateFileBase } from '@baseplate-dev/sync';

import { templateFileMetadataBaseSchema } from '@baseplate-dev/sync';
import { templateConfigSchema } from '@baseplate-dev/sync/extractor-v2';
import { z } from 'zod';

import type { TemplateFileOptions } from '../schemas/template-file-options.js';

import { templateFileOptionsSchema } from '../schemas/template-file-options.js';

export const RAW_TEMPLATE_TYPE = 'raw';

export const rawTemplateGeneratorTemplateMetadataSchema =
  templateConfigSchema.extend({
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The path of the template relative to the closest file path root.
     */
    pathRootRelativePath: z.string().optional(),
  });

export const rawTemplateOutputTemplateMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    /**
     * The type of the template (always `raw`)
     */
    type: z.literal(RAW_TEMPLATE_TYPE),
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
  });

/**
 * Metadata for a raw template file
 */
export type RawTemplateOutputTemplateMetadata = z.infer<
  typeof rawTemplateOutputTemplateMetadataSchema
>;

/**
 * A template for a raw file with no replacements.
 */
export interface RawTemplateFile extends TemplateFileBase {
  fileOptions: TemplateFileOptions;
}

/**
 * Create a raw template file
 */
export function createRawTemplateFile(
  templateFile: RawTemplateFile,
): RawTemplateFile {
  return templateFile;
}
