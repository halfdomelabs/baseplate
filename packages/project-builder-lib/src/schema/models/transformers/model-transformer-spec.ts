import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type {
  ModelTransformerSchemaCreator,
  ModelTransformerType,
} from './types.js';

import { BUILT_IN_TRANSFORMERS } from './built-in-transformers.js';

/**
 * Spec for registering additional model transformer types
 */
export const modelTransformerSpec = createFieldMapSpec(
  'core/model-transformer',
  (t) => ({
    transformers: t.namedArrayToMap<
      ModelTransformerType<ModelTransformerSchemaCreator>
    >(BUILT_IN_TRANSFORMERS),
  }),
);
