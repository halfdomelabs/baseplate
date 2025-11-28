import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

import type { ModelTransformerType } from './types.js';

import { BUILT_IN_TRANSFORMERS } from './built-in-transformers.js';

/**
 * Spec for registering additional model transformer types
 */
export interface ModelTransformerSpec extends PluginSpecImplementation {
  registerModelTransformer: <T extends DefinitionSchemaCreator>(
    transformer: ModelTransformerType<T>,
  ) => void;
  getModelTransformers: () => Record<string, ModelTransformerType>;
  getModelTransformer: (name: string) => ModelTransformerType;
}

export function createModelTransformerImplementation(): ModelTransformerSpec {
  const transformers: Record<string, ModelTransformerType> = {};
  for (const transformer of BUILT_IN_TRANSFORMERS) {
    transformers[transformer.name] =
      transformer as unknown as ModelTransformerType;
  }

  return {
    registerModelTransformer(transformer) {
      if (transformer.name in transformers) {
        throw new Error(
          `Model transformer with name ${transformer.name} is already registered`,
        );
      }
      transformers[transformer.name] =
        transformer as unknown as ModelTransformerType;
    },
    getModelTransformers() {
      return transformers;
    },
    getModelTransformer(name) {
      if (!(name in transformers)) {
        throw new Error(`Unable to find transformer with name ${name}`);
      }
      return transformers[name];
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const modelTransformerSpec = createPluginSpec('core/model-transformer', {
  defaultInitializer: createModelTransformerImplementation,
});
