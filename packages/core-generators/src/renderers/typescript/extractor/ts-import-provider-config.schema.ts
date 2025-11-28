import { z } from 'zod';

/**
 * Schema for ts-imports provider configuration in providers.json
 *
 * @example
 * {
 *   "authServiceImportsProvider": {
 *     "type": "ts-imports",
 *     "providerExport": "authServiceImportsProvider",
 *     "schemaExport": "authServiceImportsSchema",
 *     "projectExports": {
 *       "authServiceImports": {}
 *     }
 *   }
 * }
 */
export const tsImportProviderConfigSchema = z.object({
  /**
   * The type of the provider, must be "ts-imports"
   */
  type: z.literal('ts-imports'),
  /**
   * The type of the provider exported by the file
   */
  providerExport: z.string(),
  /**
   * The schema of the import map
   */
  schemaExport: z.string(),
  /**
   * Project exports of the provider, e.g. the import map following same schema as the export
   */
  projectExports: z.record(z.string(), z.looseObject({})),
});
