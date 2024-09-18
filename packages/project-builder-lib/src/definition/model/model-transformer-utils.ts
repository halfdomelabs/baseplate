import { ProjectDefinitionContainer } from '../project-definition-container.js';
import { PluginImplementationStore } from '@src/plugins/index.js';
import {
  ModelTransformerType,
  TransformerConfig,
  modelTransformerSpec,
} from '@src/schema/index.js';

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
