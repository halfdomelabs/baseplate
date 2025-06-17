import { z } from 'zod';

/**
 * Schema for TypeScript extractor configuration in extractor.json
 *
 * @example
 * {
 *   "extractors": {
 *     "ts": {
 *       "importProviders": [
 *         "@baseplate-dev/fastify-generators:authImportsProvider"
 *       ],
 *       "skipDefaultImportMap": false
 *     }
 *   }
 * }
 */
export const tsExtractorConfigSchema = z
  .object({
    /**
     * Optional, import providers that this generator implements (must be declared in providers.json)
     * Always specified as package-name:provider-name
     */
    importProviders: z.array(z.string()).optional(),
    /**
     * Optional, whether to skip the default import map generation
     */
    skipDefaultImportMap: z.boolean().default(false),
  })
  .default({});

/**
 * Type for TypeScript extractor configuration
 */
export type TsExtractorConfig = z.infer<typeof tsExtractorConfigSchema>;
