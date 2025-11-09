import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createDefinitionEntityNameResolver } from '#src/references/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from '../types.js';
import { baseTransformerFields, createModelTransformerType } from './types.js';

export const createEmbeddedRelationTransformerSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    ctx.withEnt(
      z.object({
        ...baseTransformerFields,
        foreignRelationRef: ctx.withRef({
          type: modelForeignRelationEntityType,
          onDelete: 'DELETE_PARENT',
          parentPath: { context: 'model' },
        }),
        type: z.literal('embeddedRelation'),
        embeddedFieldNames: z.array(
          ctx.withRef({
            type: modelScalarFieldEntityType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'embeddedModel' },
          }),
        ),
        embeddedTransformerNames: z
          .array(
            ctx.withRef({
              type: modelTransformerEntityType,
              onDelete: 'RESTRICT',
              parentPath: { context: 'embeddedModel' },
            }),
          )
          .optional(),
        modelRef: ctx.withRef({
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
      {
        type: modelTransformerEntityType,
        parentPath: { context: 'model' },
        getNameResolver: (entity) =>
          createDefinitionEntityNameResolver({
            idsToResolve: { foreignRelation: entity.foreignRelationRef },
            resolveName: (entityNames) => entityNames.foreignRelation,
          }),
      },
    ),
    (builder) => {
      builder.addPathToContext('modelRef', modelEntityType, 'embeddedModel');
    },
  ),
);

export type EmbeddedRelationTransformerConfig = def.InferOutput<
  typeof createEmbeddedRelationTransformerSchema
>;

export const BUILT_IN_TRANSFORMERS = [
  createModelTransformerType({
    name: 'embeddedRelation',
    createSchema: createEmbeddedRelationTransformerSchema,
    getName: (definitionContainer, definition) =>
      definitionContainer.nameFromId(definition.foreignRelationRef),
  }),
];
