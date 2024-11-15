import type { PluginImplementationStore } from '@src/plugins/index.js';
import type {
  ModelTransformerType,
  TransformerConfig,
} from '@src/schema/index.js';

import { modelTransformerSpec } from '@src/schema/index.js';

import type { ProjectDefinitionContainer } from '../project-definition-container.js';

function getTransformer(
  transformer: TransformerConfig,
  pluginStore: PluginImplementationStore,
): ModelTransformerType {
  const transformers = pluginStore.getPluginSpec(modelTransformerSpec);
  return transformers.getModelTransformer(transformer.type);
}

function getTransformName(
  definitionContainer: ProjectDefinitionContainer,
  transformer: TransformerConfig,
  pluginStore: PluginImplementationStore,
): string {
  const transformers = pluginStore.getPluginSpec(modelTransformerSpec);
  return transformers
    .getModelTransformer(transformer.type)
    .getName(definitionContainer, transformer);
}

export const ModelTransformerUtils = { getTransformer, getTransformName };
