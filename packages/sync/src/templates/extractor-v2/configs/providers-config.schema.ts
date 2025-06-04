import { z } from 'zod';

/**
 * Main schema for providers.json configuration
 * Maps file paths to their provider definitions
 *
 * @example
 * {
 *   "feature.ts": {
 *     "featuresProvider": {
 *       "type": "path",
 *       "pathKey": "feature-root",
 *       "method": "getFeatureRoot"
 *     }
 *   }
 * }
 */
export const extractorProvidersConfigSchema = z.record(
  z.string(), // file path
  z.record(
    z.string(), // provider name
    z
      .object({
        type: z.string(),
      })
      .passthrough(),
  ),
);
