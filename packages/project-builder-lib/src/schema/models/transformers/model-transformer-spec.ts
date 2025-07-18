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
  getModelTransformers: () => Partial<Record<string, ModelTransformerType>>;
  getModelTransformer: (name: string) => ModelTransformerType;
}

export function createModelTransformerImplementation(): ModelTransformerSpec {
  const transformers: Partial<Record<string, ModelTransformerType>> = {};
  for (const transformer of BUILT_IN_TRANSFORMERS) {
    transformers[transformer.name] =
      transformer as unknown as ModelTransformerType;
  }

  return {
    registerModelTransformer(transformer) {
      if (transformers[transformer.name]) {
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
      const transformer = transformers[name];
      if (!transformer) {
        throw new Error(`Unable to find transformer with name ${name}`);
      }
      return transformer;
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const modelTransformerSpec = createPluginSpec('core/model-transformer', {
  defaultInitializer: createModelTransformerImplementation,
});
