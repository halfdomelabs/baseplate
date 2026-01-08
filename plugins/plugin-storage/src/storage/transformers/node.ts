import type { ModelTransformerCompiler } from '@baseplate-dev/project-builder-lib';

import {
  createPluginModule,
  modelTransformerCompilerSpec,
} from '@baseplate-dev/project-builder-lib';

import { fileDataFieldGenerator } from '#src/generators/fastify/index.js';

import type { FileTransformerDefinition } from './schema/file-transformer.schema.js';

function buildFileTransformerCompiler(): ModelTransformerCompiler<FileTransformerDefinition> {
  return {
    name: 'file',
    compileField(definition, { model }) {
      const { fileRelationRef, category } = definition;

      const foreignRelation = model.model.relations?.find(
        (relation) => relation.id === fileRelationRef,
      );

      if (!foreignRelation) {
        throw new Error(
          `Could not find relation ${fileRelationRef} for file field`,
        );
      }

      return fileDataFieldGenerator({
        modelName: model.name,
        relationName: foreignRelation.name,
        category: category.name,
        featureId: model.featureRef,
      });
    },
  };
}

export default createPluginModule({
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
