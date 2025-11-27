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
     * Optional, the name of the default import provider to use (must end with 'ImportsProvider'). Defaults to the generator name with ImportsProvider suffix.
     */
    defaultImportProviderName: z
      .string()
      .endsWith('ImportsProvider')
      .optional(),
    /**
     * Optional, whether to skip the default import map generation
     */
    skipDefaultImportMap: z.boolean().default(false),
  })
  .prefault({});

/**
 * Type for TypeScript extractor configuration
 */
export type TsExtractorConfig = z.infer<typeof tsExtractorConfigSchema>;
