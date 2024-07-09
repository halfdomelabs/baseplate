import { z } from 'zod';

import { BUILT_IN_TRANSFORMERS } from './built-in-transformers.js';
import { ModelTransformerType } from './types.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/spec/types.js';
import { ZodRef } from '@src/references/ref-builder.js';

/**
 * Spec for registering additional model transformer types
 */
export interface ModelTransformerSpec extends PluginSpecImplementation {
  registerModelTransformer: <T extends z.ZodTypeAny>(
    transformer: ModelTransformerType<T>,
  ) => void;
  getModelTransformers: () => Record<string, ModelTransformerType>;
  getModelTransformer: (name: string) => ModelTransformerType;
}

export function createModelTransformerImplementation(): ModelTransformerSpec {
  const transformers = BUILT_IN_TRANSFORMERS.reduce(
    (acc, transformer) => {
      acc[transformer.name] = transformer as unknown as ModelTransformerType;
      return acc;
    },
    {} as Record<string, ModelTransformerType>,
  );

  return {
    registerModelTransformer(transformer) {
      if (transformers[transformer.name]) {
        throw new Error(
          `Model transformer with name ${transformer.name} is already registered`,
        );
      }
      // check transformer schema is a zEnt
      if (!(transformer.schema instanceof ZodRef)) {
        throw new Error(
          `Model transformer schema for ${transformer.name} is not a zEnt`,
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
