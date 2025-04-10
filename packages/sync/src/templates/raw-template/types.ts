import { z } from 'zod';

import type { TemplateFileBase } from '../types.js';

import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';

export const RAW_TEMPLATE_TYPE = 'raw';

export const rawTemplateFileMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(RAW_TEMPLATE_TYPE),
  });

/**
 * Metadata for a raw template file
 */
export type RawTemplateFileMetadata = z.infer<
  typeof rawTemplateFileMetadataSchema
>;

/**
 * A template for a raw file with no replacements.
 */
export type RawTemplateFile = TemplateFileBase;

/**
 * Create a raw template file
 */
export function createRawTemplateFile(
  templateFile: RawTemplateFile,
): RawTemplateFile {
  return templateFile;
}
