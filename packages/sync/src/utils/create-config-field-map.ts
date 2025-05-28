import type {
  FieldMap,
  FieldMapSchema,
  FieldMapSchemaBuilder,
} from '@halfdomelabs/utils';

import { createFieldMap } from '@halfdomelabs/utils';

import { getRunnerContext } from '#src/runner/runner-context.js';

/**
 * Creates a field map using the task ID as a dynamic source
 */
export function createConfigFieldMap<S extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => S,
): FieldMap<S> {
  return createFieldMap(schemaBuilder, {
    getDynamicSource: () => getRunnerContext()?.taskId,
  });
}
