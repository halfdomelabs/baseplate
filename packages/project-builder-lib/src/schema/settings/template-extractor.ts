import { z } from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { def } from '../creator/index.js';

/**
 * Template extractor configuration schema
 *
 * Controls how template extraction works when syncing projects.
 * Template extraction allows updating generator templates from working code.
 */
export const createTemplateExtractorSchema = definitionSchema(() =>
  z.object({
    /**
     * Whether to write template extractor metadata when writing files to the project.
     *
     * When enabled, Baseplate will write `.templates-info.json` files that track
     * which generated files correspond to which templates. This metadata enables
     * the template extraction process to update the generator's templates from
     * your working code.
     *
     * Useful for: Generator development, template refinement, extracting patterns
     * Default: false
     */
    writeMetadata: z.boolean().default(false),

    /**
     * A list of file IDs to include in the template extractor metadata.
     *
     * Used for generators that have manually assigned file IDs, particularly
     * generators with multiple instances (e.g. one generator per model).
     *
     * Format: Newline-delimited list of patterns
     * Supports wildcards: Use * to match any number of characters
     *
     * Example:
     * ```
     * user-*
     * post-*
     * comment-service-*
     * ```
     *
     * Default: empty string (no file ID whitelist)
     */
    fileIdRegexWhitelist: z.string().default(''),
  }),
);

/**
 * Template extractor configuration type (output after validation)
 */
export type TemplateExtractorDefinition = def.InferOutput<
  typeof createTemplateExtractorSchema
>;
