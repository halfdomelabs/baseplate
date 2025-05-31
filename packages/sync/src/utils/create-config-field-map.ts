import type {
  FieldMap,
  FieldMapSchema,
  FieldMapSchemaBuilder,
} from '@baseplate-dev/utils';

import { createFieldMap } from '@baseplate-dev/utils';

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
