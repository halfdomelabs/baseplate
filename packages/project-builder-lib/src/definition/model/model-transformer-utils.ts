import { ProjectDefinitionContainer } from '../project-definition-container.js';
import { PluginImplementationStore } from '@src/plugins/index.js';
import { TransformerConfig, modelTransformerSpec } from '@src/schema/index.js';

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

export const ModelTransformerUtils = {
  getTransformName,
};
