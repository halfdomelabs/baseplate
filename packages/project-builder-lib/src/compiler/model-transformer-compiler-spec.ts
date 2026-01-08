import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ModelConfig } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { TransformerConfig } from '../schema/models/transformers/types.js';

export interface ModelTransformerCompiler<
  T extends TransformerConfig = TransformerConfig,
> {
  name: string;
  compileField: (
    definition: T,
    {
      definitionContainer,
      model,
    }: {
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
    },
  ) => GeneratorBundle;
}

/**
 * Spec for registering model transformer compilers
 */
export const modelTransformerCompilerSpec = createFieldMapSpec(
  'core/model-transformer-compiler',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformers: t.map<string, ModelTransformerCompiler<any>>(),
  }),
);
