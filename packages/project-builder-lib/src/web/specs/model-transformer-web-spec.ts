import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ModelConfigInput, TransformerConfig } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

export interface ModelTransformerWebFormFieldsProps {
  // oxlint-disable-next-line typescript/no-explicit-any
  formProps: UseFormReturn<any>;
  name: string;
  originalModel: ModelConfigInput;
  pluginKey: string | undefined;
}

export interface ModelTransformerWebFullFormProps {
  transformer?: TransformerConfig;
  onUpdate: (transformer: TransformerConfig) => void;
  isCreate: boolean;
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
  /**
   * Full form component that owns the entire form element, submit logic, and footer.
   * Mutually exclusive with `FormFields`.
   */
  Form?: React.ComponentType<ModelTransformerWebFullFormProps>;
  /**
   * Form fields component that provides only the fields.
   * The framework wraps it in a `<form>` element with dialog footer.
   * Mutually exclusive with `Form`.
   */
  FormFields?: React.ComponentType<ModelTransformerWebFormFieldsProps>;
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
 * Spec for adding web config for transformers
 */
export const modelTransformerWebSpec = createFieldMapSpec(
  'core/model-transformer-web',
  (t) => ({
    // oxlint-disable-next-line typescript/no-explicit-any -- plugins register varying transformer types at runtime
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
      getWebConfigs: () => [...values.transformers.values()],
    }),
  },
);
