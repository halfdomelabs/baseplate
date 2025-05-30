import type { ModelTransformerCompiler } from '@halfdomelabs/project-builder-lib';

import {
  createPlatformPluginExport,
  modelTransformerCompilerSpec,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';

import { prismaFileTransformerGenerator } from '#src/generators/fastify/index.js';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition.js';
import type { FileTransformerConfig } from './types.js';

function buildFileTransformerCompiler(
  pluginId: string,
): ModelTransformerCompiler<FileTransformerConfig> {
  return {
    name: 'file',
    compileTransformer(definition, { definitionContainer, model }) {
      const { fileRelationRef } = definition;

      const foreignRelation = model.model.relations?.find(
        (relation) => relation.id === fileRelationRef,
      );

      if (!foreignRelation) {
        throw new Error(
          `Could not find relation ${fileRelationRef} for file transformer`,
        );
      }

      const storageDefinition = PluginUtils.configByIdOrThrow(
        definitionContainer.definition,
        pluginId,
      ) as StoragePluginDefinition;

      const category = storageDefinition.categories.find(
        (c) => c.usedByRelationRef === foreignRelation.foreignId,
      );

      if (!category) {
        throw new Error(
          `Could not find category for relation ${foreignRelation.name}`,
        );
      }

      return prismaFileTransformerGenerator({
        category: category.name,
        name: foreignRelation.name,
      });
    },
  };
}

export default createPlatformPluginExport({
  dependencies: {
    transformerCompiler: modelTransformerCompilerSpec,
  },
  exports: {},
  initialize: ({ transformerCompiler }, { pluginId }) => {
    transformerCompiler.registerTransformerCompiler(
      buildFileTransformerCompiler(pluginId),
    );
    return {};
  },
});
