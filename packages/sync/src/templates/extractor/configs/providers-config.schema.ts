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
 *       "pathRoots": [
 *         {
 *           "name": "feature-root",
 *           "method": "featureRoot"
 *         }
 *       ]
 *     }
 *   }
 * }
 */
export const extractorProvidersConfigSchema = z.record(
  z.string(), // file path
  z.record(
    z.string(), // provider name
    z.looseObject({
      type: z.string(),
    }),
  ),
);
