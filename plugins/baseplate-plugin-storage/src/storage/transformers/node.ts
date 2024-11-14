import {
  ModelTransformerCompiler,
  PluginUtils,
  createPlatformPluginExport,
  modelTransformerCompilerSpec,
} from '@halfdomelabs/project-builder-lib';

import { FileTransformerConfig } from './types';
import { StoragePluginDefinition } from '../core/schema/plugin-definition';
import { PrismaFileTransformerDescriptor } from '@src/generators/fastify';

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
        (c) => c.usedByRelation === foreignRelation.foreignId,
      );

      if (!category) {
        throw new Error(
          `Could not find category for relation ${foreignRelation.name}`,
        );
      }

      return {
        generator:
          '@halfdomelabs/baseplate-plugin-storage/fastify/prisma-file-transformer',
        category: category.name,
        name: foreignRelation.name,
      } satisfies PrismaFileTransformerDescriptor;
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
