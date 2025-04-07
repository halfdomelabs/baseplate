import { z } from 'zod';

export const templateExtractorSchema = z.object({
  /**
   * Whether to write template extractor metadata when writing files to the project.
   *
   * This allows the template extraction process to update the generator's templates.
   */
  writeMetadata: z.boolean().default(false),
  /**
   * A comma-delimited list of generator name patterns to filter which generators will write template extractor metadata.
   *
   * Use `*` to match any characters.
   *
   * If not provided, all generators will write template extractor metadata.
   */
  generatorPatterns: z.string().default(''),
});

export type TemplateExtractorDefinition = z.infer<
  typeof templateExtractorSchema
>;
