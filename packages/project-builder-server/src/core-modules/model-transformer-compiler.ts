import type {
  EmbeddedRelationTransformerConfig,
  ModelTransformerCompiler,
} from '@baseplate-dev/project-builder-lib';

import { prismaDataNestedFieldGenerator } from '@baseplate-dev/fastify-generators';
import {
  createPluginModule,
  modelTransformerCompilerSpec,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';

const embeddedRelationTransformerCompiler: ModelTransformerCompiler<EmbeddedRelationTransformerConfig> =
  {
    name: 'embeddedRelation',
    compileField(definition, { definitionContainer, model }) {
      // find foreign relation
      const nestedRelation = ModelUtils.getRelationsToModel(
        definitionContainer.definition,
        model.id,
      ).find(
        ({ relation }) => relation.foreignId === definition.foreignRelationRef,
      );

      if (!nestedRelation) {
        throw new Error(
          `Could not find relation ${definition.foreignRelationRef} for nested relation field`,
        );
      }

      return prismaDataNestedFieldGenerator({
        modelName: model.name,
        relationName: definitionContainer.nameFromId(
          definition.foreignRelationRef,
        ),
        nestedModelName: nestedRelation.model.name,
        scalarFieldNames: definition.embeddedFieldNames.map((e) =>
          definitionContainer.nameFromId(e),
        ),
        virtualInputFieldNames: definition.embeddedTransformerNames?.map((t) =>
          definitionContainer.nameFromId(t),
        ),
      });
    },
  };

export const modelTransformerCoreModule = createPluginModule({
  name: 'model-transformer-compiler',
  dependencies: {
    modelTransformerCompiler: modelTransformerCompilerSpec,
  },
  initialize: ({ modelTransformerCompiler }) => {
    modelTransformerCompiler.transformers.addMany([
      embeddedRelationTransformerCompiler,
    ]);
  },
});
