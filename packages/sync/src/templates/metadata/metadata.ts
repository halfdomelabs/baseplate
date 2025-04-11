import { z } from 'zod';

export const templateFileMetadataBaseSchema = z.object({
  /**
   * The type of the file.
   */
  type: z.string(),
  /**
   * The name of the template (must be unique within a generator).
   */
  name: z.string().regex(/^[a-z\-0-9]+$/, 'must be kebab case'),
  /**
   * The name of the generator that created the file.
   */
  generator: z.string(),
  /**
   * The path of the template that was used to create the file relative to the generator's template directory.
   */
  template: z.string(),
});

export type TemplateFileMetadataBase = z.infer<
  typeof templateFileMetadataBaseSchema
>;
