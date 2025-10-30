import type {
  InferTsImportMapFromSchema,
  TsImportMapSchemaEntry,
} from '../renderers/typescript/import-maps/types.js';

import { createTsImportMap } from '../renderers/typescript/import-maps/ts-import-map.js';

/**
 * Creates a test import map with consistent module specifiers for testing
 *
 * Each import will use the pattern `<name>/<importKey>`, making it easy to
 * identify which test module an import comes from
 *
 * @param importSchema - The import map schema to use
 * @param name - Base name for the module (e.g., 'data-utils')
 * @returns A mock import provider for testing
 *
 * @example
 * ```typescript
 * const schema = createTsImportMapSchema({
 *   scalarField: {},
 *   relationHelpers: {},
 * });
 *
 * const imports = createTestTsImportMap(schema, 'data-utils');
 * // Creates imports:
 * //   scalarField -> 'data-utils/scalarField'
 * //   relationHelpers -> 'data-utils/relationHelpers'
 * ```
 */
export function createTestTsImportMap<
  T extends Record<string, TsImportMapSchemaEntry>,
>(importSchema: T, name: string): InferTsImportMapFromSchema<T> {
  // Build the imports object based on the schema
  const imports: Record<string, string> = {};

  for (const key of Object.keys(importSchema)) {
    imports[key] = `${name}/${key}`;
  }

  return createTsImportMap(importSchema, imports as Record<keyof T, string>);
}
