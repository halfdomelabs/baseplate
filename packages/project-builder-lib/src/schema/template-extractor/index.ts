import { z } from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { def } from '../creator/index.js';

export const createTemplateExtractorSchema = definitionSchema(() =>
  z.object({
    /**
     * Whether to write template extractor metadata when writing files to the project.
     *
     * This allows the template extraction process to update the generator's templates.
     */
    writeMetadata: z.boolean().default(false),
    /**
     * A list of file IDs to include in the template extractor metadata for generators
     * that have a manually assigned file IDs, e.g. files generated by generators that
     * have multiple instances.
     *
     * The list is delimited by a newline and can include a * to match any number of characters.
     */
    fileIdRegexWhitelist: z.string().default(''),
  }),
);

export type TemplateExtractorDefinition = def.InferOutput<
  typeof createTemplateExtractorSchema
>;
