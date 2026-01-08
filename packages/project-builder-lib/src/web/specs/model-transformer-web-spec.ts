import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ModelConfigInput, TransformerConfig } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

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

export function createModelTransformerWebConfig<T extends TransformerConfig>(
  config: ModelTransformerWebConfig<T>,
): ModelTransformerWebConfig<T> {
  return config;
}

/**
 * Use interface for model transformer web spec.
 */
export interface ModelTransformerWebUse {
  getTransformerWebConfig: (name: string) => ModelTransformerWebConfig;
  getTransformerWebConfigs: () => ModelTransformerWebConfig[];
}

/**
 * Spec for adding web config for transformers
 */
export const modelTransformerWebSpec = createFieldMapSpec(
  'core/model-transformer-web',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformers: t.namedArrayToMap<ModelTransformerWebConfig<any>>(),
  }),
  {
    use: (values) => ({
      getWebConfigOrThrow(name: string) {
        const transformer = values.transformers.get(name);
        if (!transformer) {
          throw new Error(`Transformer ${name} not found`);
        }
        return transformer;
      },
    }),
  },
);
