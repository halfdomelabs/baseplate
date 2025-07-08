import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

export const templateFileMetadataBaseSchema = z.object({
  /**
   * The name of the template (must be unique within a generator).
   */
  name: CASE_VALIDATORS.KEBAB_CASE,
  /**
   * The template extractor type e.g. ts or raw.
   */
  type: z.string(),
  /**
   * The name of the generator that created the file.
   */
  generator: z.string().min(1),
});

export type TemplateFileMetadataBase = z.infer<
  typeof templateFileMetadataBaseSchema
>;

/**
 * Schema for individual template info in .templates-info.json
 */
export const templateInfoSchema = z.object({
  /**
   * The name of the template (references template name key in extractor.json)
   */
  template: CASE_VALIDATORS.KEBAB_CASE,
  /**
   * The name of the generator that created the file.
   */
  generator: z.string().min(1),
  /**
   * Instance-specific data for the template. Presence indicates file is extractable.
   */
  instanceData: z.object({}).passthrough().optional(),
});

export type TemplateInfo<
  TInstanceData extends Record<string, unknown> = Record<string, unknown>,
> = z.infer<typeof templateInfoSchema> & {
  instanceData?: TInstanceData | undefined;
};

/**
 * Schema for the entire .templates-info.json file
 */
export const templatesInfoFileSchema = z.record(z.string(), templateInfoSchema);

export type TemplatesInfoFile = z.infer<typeof templatesInfoFileSchema>;
