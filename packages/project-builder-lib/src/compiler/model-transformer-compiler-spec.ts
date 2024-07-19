import type { DescriptorWithChildren } from './types.js';
import { TransformerConfig } from '../schema/models/transformers/types.js';
import { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/spec/types.js';
import { ModelConfig } from '@src/schema/index.js';

export interface ModelTransformerCompiler<
  T extends TransformerConfig = TransformerConfig,
> {
  name: string;
  compileTransformer: (
    definition: T,
    {
      definitionContainer,
      model,
    }: {
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
    },
  ) => DescriptorWithChildren;
}

/**
 * Spec for registering transformer compilers
 */
export interface ModelTransformerCompilerSpec extends PluginSpecImplementation {
  registerTransformerCompiler: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformer: ModelTransformerCompiler<any>,
  ) => void;
  getModelTransformerCompiler: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInTransformers?: ModelTransformerCompiler<any>[],
  ) => ModelTransformerCompiler;
}

export function createModelTransformerCompilerImplementation(): ModelTransformerCompilerSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformers: Record<string, ModelTransformerCompiler<any>> = {};

  return {
    registerTransformerCompiler(transformer) {
      if (transformers[transformer.name]) {
        throw new Error(
          `Model transformer with name ${transformer.name} is already registered`,
        );
      }
      transformers[transformer.name] = transformer;
    },
    getModelTransformerCompiler(name, builtInTransformers = []) {
      const builtInTransformer = builtInTransformers.find(
        (b) => b.name === name,
      );
      if (builtInTransformer) {
        return builtInTransformer as ModelTransformerCompiler;
      }
      const transformer = transformers[name];
      if (!transformer) {
        throw new Error(`Unable to find transformer with name ${name}`);
      }
      return transformer as ModelTransformerCompiler;
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const modelTransformerCompilerSpec = createPluginSpec(
  'core/model-transformer-compiler',
  { defaultInitializer: createModelTransformerCompilerImplementation },
);
