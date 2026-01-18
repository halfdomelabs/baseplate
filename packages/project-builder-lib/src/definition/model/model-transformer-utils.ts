import type { PluginSpecStore } from '#src/plugins/index.js';
import type { TransformerConfig } from '#src/schema/index.js';

import { modelTransformerSpec } from '#src/schema/index.js';

import type { ProjectDefinitionContainer } from '../project-definition-container.js';

function getTransformerName(
  definitionContainer: ProjectDefinitionContainer,
  transformer: TransformerConfig,
  pluginStore: PluginSpecStore,
): string {
  const { transformers } = pluginStore.use(modelTransformerSpec);
  const transformerType = transformers.get(transformer.type);
  if (!transformerType) {
    throw new Error(`Unable to find transformer with name ${transformer.type}`);
  }
  return transformerType.getName(definitionContainer, transformer);
}

export const ModelTransformerUtils = { getTransformerName };
