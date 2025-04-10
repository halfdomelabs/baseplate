import { z } from 'zod';

export const templateExtractorSchema = z.object({
  /**
   * Whether to write template extractor metadata when writing files to the project.
   *
   * This allows the template extraction process to update the generator's templates.
   */
  writeMetadata: z.boolean().default(false),
});

export type TemplateExtractorDefinition = z.infer<
  typeof templateExtractorSchema
>;
