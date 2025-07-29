import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type { ModelConfigInput, TransformerConfig } from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface ModelTransformerWebFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formProps: UseFormReturn<any>;
  name: string;
  originalModel: ModelConfigInput;
  pluginKey: string | undefined;
}

export interface ModelTransformerWebConfig<
  T extends TransformerConfig = TransformerConfig,
> {
  name: string;
  pluginKey: string | undefined;
  label: string;
  description: string;
  instructions?: string;
  Form?: React.ComponentType<ModelTransformerWebFormProps>;
  allowNewTransformer?: (
    projectContainer: ProjectDefinitionContainer,
    modelConfig: ModelConfigInput,
  ) => boolean;
  getNewTransformer: (
    projectContainer: ProjectDefinitionContainer,
    modelConfig: ModelConfigInput,
  ) => T;
  getSummary: (
    definition: T,
    definitionContainer: ProjectDefinitionContainer,
  ) => {
    label: string;
    description: string;
  }[];
}

export function createNewModelTransformerWebConfig<T extends TransformerConfig>(
  config: ModelTransformerWebConfig<T>,
): ModelTransformerWebConfig<T> {
  return config;
}

/**
 * Spec for registering transformer compilers
 */
export interface ModelTransformerWebSpec extends PluginSpecImplementation {
  registerTransformerWebConfig: <T extends TransformerConfig>(
    transformer: ModelTransformerWebConfig<T>,
  ) => void;
  getTransformerWebConfig: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInTransformers?: ModelTransformerWebConfig<any>[],
  ) => ModelTransformerWebConfig;
  getTransformerWebConfigs: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInTransformers?: ModelTransformerWebConfig<any>[],
  ) => ModelTransformerWebConfig[];
}

export function createModelTransformerWebImplementation(): ModelTransformerWebSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformers = new Map<string, ModelTransformerWebConfig<any>>();

  return {
    registerTransformerWebConfig(transformer) {
      if (transformers.has(transformer.name)) {
        throw new Error(
          `Model transformer with name ${transformer.name} is already registered`,
        );
      }
      transformers.set(transformer.name, transformer);
    },
    getTransformerWebConfig(name, builtInTransformers = []) {
      const builtInTransformer = builtInTransformers.find(
        (b) => b.name === name,
      );
      if (builtInTransformer) {
        return builtInTransformer as ModelTransformerWebConfig;
      }
      const transformer = transformers.get(name);
      if (!transformer) {
        throw new Error(`Unable to find transformer with name ${name}`);
      }
      return transformer as ModelTransformerWebConfig;
    },
    getTransformerWebConfigs(builtInTransformers = []) {
      return [...builtInTransformers, ...transformers.values()];
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const modelTransformerWebSpec = createPluginSpec(
  'core/model-transformer-web',
  { defaultInitializer: createModelTransformerWebImplementation },
);
