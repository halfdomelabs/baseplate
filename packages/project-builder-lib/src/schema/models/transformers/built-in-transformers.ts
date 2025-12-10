import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createDefinitionEntityNameResolver } from '#src/references/index.js';
import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from '../types.js';
import { baseTransformerFields, createModelTransformerType } from './types.js';

export const createEmbeddedRelationTransformerSchema =
  definitionSchemaWithSlots(
    { modelSlot: modelEntityType },
    (ctx, { modelSlot }) =>
      ctx.refContext(
        { embeddedModelSlot: modelEntityType },
        ({ embeddedModelSlot }) =>
          ctx.withEnt(
            z.object({
              ...baseTransformerFields,
              foreignRelationRef: ctx.withRef({
                type: modelForeignRelationEntityType,
                onDelete: 'DELETE_PARENT',
                parentRef: modelSlot,
              }),
              type: z.literal('embeddedRelation'),
              embeddedFieldNames: z.array(
                ctx.withRef({
                  type: modelScalarFieldEntityType,
                  onDelete: 'RESTRICT',
                  parentRef: embeddedModelSlot,
                }),
              ),
              embeddedTransformerNames: z
                .array(
                  ctx.withRef({
                    type: modelTransformerEntityType,
                    onDelete: 'RESTRICT',
                    parentRef: embeddedModelSlot,
                  }),
                )
                .optional(),
              modelRef: ctx.withRef({
                type: modelEntityType,
                onDelete: 'RESTRICT',
                provides: embeddedModelSlot,
              }),
            }),
            {
              type: modelTransformerEntityType,
              parentRef: modelSlot,
              getNameResolver: (entity) =>
                createDefinitionEntityNameResolver({
                  idsToResolve: { foreignRelation: entity.foreignRelationRef },
                  resolveName: (entityNames) => entityNames.foreignRelation,
                }),
            },
          ),
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
