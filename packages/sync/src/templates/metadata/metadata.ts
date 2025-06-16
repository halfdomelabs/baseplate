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
  // TODO[2025-06-16]: Remove once we have finished migration to extractor v2
  /**
   * The path of the template that was used to create the file.
   */
  template: z.string().default(''),
});

export type TemplateFileMetadataBase = z.infer<
  typeof templateFileMetadataBaseSchema
>;
