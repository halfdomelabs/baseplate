import type {
  FieldMap,
  FieldMapSchema,
  FieldMapSchemaBuilder,
} from '@baseplate-dev/utils';

import { createFieldMap } from '@baseplate-dev/utils';

import { getPluginContext } from '../context/plugin-context.js';

/**
 * Creates a field map that automatically tracks which plugin registered each value.
 *
 * Similar to `createConfigFieldMap` in the sync package, this utility uses the
 * current plugin context to track the source of registrations. This enables
 * clear error messages when registration conflicts occur.
 *
 * @example
 * ```typescript
 * const fieldMap = createPluginFieldMap((t) => ({
 *   transformers: t.map<string, Transformer>(),
 * }));
 *
 * // When a plugin tries to overwrite a value:
 * // Error: Value for key 'myTransformer' has already been set by plugin-auth
 * //        and cannot be overwritten by plugin-storage
 * ```
 *
 * @param schemaBuilder - A function that builds the field map schema
 * @returns A field map with automatic source tracking
 */
export function createPluginFieldMap<S extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => S,
): FieldMap<S> {
  return createFieldMap(schemaBuilder, {
    getDynamicSource: () => getPluginContext()?.pluginKey,
  });
}
