import type {
  FieldMapSchema,
  FieldMapSchemaBuilder,
  FieldMapValues,
} from '@baseplate-dev/utils';

import type { PluginSpec } from '../spec/types.js';

import { createPluginSpec } from '../spec/types.js';
import { createPluginFieldMap } from './create-plugin-field-map.js';

/**
 * Creates a plugin spec backed by a FieldMap for automatic source tracking.
 *
 * @param name - Unique identifier for the spec
 * @param schemaBuilder - Function that builds the field map schema
 * @param options - Optional configuration including custom use interface
 */
export function createFieldMapSpec<
  T extends FieldMapSchema,
  TUse extends object = FieldMapValues<T>,
>(
  name: string,
  schemaBuilder: (t: FieldMapSchemaBuilder) => T,
  options?: {
    /**
     * Custom use interface builder. Receives the field map values and returns
     * the use interface. If not provided, returns the raw field map values.
     */
    use?: (values: FieldMapValues<T>) => TUse;
  },
): PluginSpec<T, TUse> {
  return createPluginSpec(name, {
    initializer: () => {
      const fieldMap = createPluginFieldMap(schemaBuilder);
      return {
        init: fieldMap,
        use: () => {
          const values = fieldMap.getValues();
          if (options?.use) {
            return options.use(values);
          }
          return values as TUse;
        },
      };
    },
  });
}
