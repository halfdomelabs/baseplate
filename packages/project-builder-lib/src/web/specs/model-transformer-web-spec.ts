import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/spec/types.js';
import { ModelConfig, TransformerConfig } from '@src/schema/index.js';

export interface ModelTransformerWebFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formProps: UseFormReturn<any>;
  name: string;
  originalModel: ModelConfig;
  pluginId: string | undefined;
}

export interface ModelTransformerWebConfig<
  T extends TransformerConfig = TransformerConfig,
> {
  name: string;
  pluginId: string | undefined;
  label: string;
  Form?: React.ComponentType<ModelTransformerWebFormProps>;
  allowNewTransformer?: (
    projectContainer: ProjectDefinitionContainer,
    modelConfig: ModelConfig,
  ) => boolean;
  getNewTransformer: (
    projectContainer: ProjectDefinitionContainer,
    modelConfig: ModelConfig,
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
  const transformers: Record<string, ModelTransformerWebConfig<any>> = {};

  return {
    registerTransformerWebConfig(transformer) {
      if (transformers[transformer.name]) {
        throw new Error(
          `Model transformer with name ${transformer.name} is already registered`,
        );
      }
      transformers[transformer.name] = transformer;
    },
    getTransformerWebConfig(name, builtInTransformers = []) {
      const builtInTransformer = builtInTransformers.find(
        (b) => b.name === name,
      );
      if (builtInTransformer) {
        return builtInTransformer as ModelTransformerWebConfig;
      }
      const transformer = transformers[name];
      if (!transformer) {
        throw new Error(`Unable to find transformer with name ${name}`);
      }
      return transformer as ModelTransformerWebConfig;
    },
    getTransformerWebConfigs(builtInTransformers = []) {
      return [...builtInTransformers, ...Object.values(transformers)];
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
