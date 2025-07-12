import type { ModelTransformerCompiler } from '@baseplate-dev/project-builder-lib';

import {
  createPlatformPluginExport,
  modelTransformerCompilerSpec,
} from '@baseplate-dev/project-builder-lib';

import { prismaFileTransformerGenerator } from '#src/generators/fastify/index.js';

import type { FileTransformerDefinition } from './schema/file-transformer.schema.js';

function buildFileTransformerCompiler(): ModelTransformerCompiler<FileTransformerDefinition> {
  return {
    name: 'file',
    compileTransformer(definition, { model }) {
      const { fileRelationRef, category } = definition;

      const foreignRelation = model.model.relations?.find(
        (relation) => relation.id === fileRelationRef,
      );

      if (!foreignRelation) {
        throw new Error(
          `Could not find relation ${fileRelationRef} for file transformer`,
        );
      }

      return prismaFileTransformerGenerator({
        category: category.name,
        name: foreignRelation.name,
        featureId: model.featureRef,
      });
    },
  };
}

export default createPlatformPluginExport({
  dependencies: {
    transformerCompiler: modelTransformerCompilerSpec,
  },
  exports: {},
  initialize: ({ transformerCompiler }) => {
    transformerCompiler.registerTransformerCompiler(
      buildFileTransformerCompiler(),
    );
    return {};
  },
});
