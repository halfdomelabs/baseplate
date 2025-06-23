import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import {
  createDefinitionEntityNameResolver,
  zEnt,
  zRef,
} from '#src/references/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from '../types.js';
import { baseTransformerFields, createModelTransformerType } from './types.js';

export const createPasswordTransformerSchema = definitionSchema(() =>
  zEnt(
    z.object({
      ...baseTransformerFields,
      type: z.literal('password'),
    }),
    {
      type: modelTransformerEntityType,
      parentPath: { context: 'model' },
      getNameResolver: () => 'password',
    },
  ),
);

export type PasswordTransformerConfig = def.InferOutput<
  typeof createPasswordTransformerSchema
>;

export const createEmbeddedRelationTransformerSchema = definitionSchema(() =>
  zEnt(
    z.object({
      ...baseTransformerFields,
      foreignRelationRef: zRef(z.string().min(1), {
        type: modelForeignRelationEntityType,
        onDelete: 'DELETE_PARENT',
        parentPath: { context: 'model' },
      }),
      type: z.literal('embeddedRelation'),
      embeddedFieldNames: z.array(
        zRef(z.string().min(1), {
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'embeddedModel' },
        }),
      ),
      embeddedTransformerNames: z
        .array(
          zRef(z.string().min(1), {
            type: modelTransformerEntityType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'embeddedModel' },
          }),
        )
        .optional(),
      modelRef: zRef(z.string().min(1), {
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
  ).refBuilder((builder) => {
    builder.addPathToContext('modelRef', modelEntityType, 'embeddedModel');
  }),
);

export type EmbeddedRelationTransformerConfig = def.InferOutput<
  typeof createEmbeddedRelationTransformerSchema
>;

export const BUILT_IN_TRANSFORMERS = [
  createModelTransformerType({
    name: 'password',
    schema: createPasswordTransformerSchema,
    getName: () => 'Password',
  }),
  createModelTransformerType({
    name: 'embeddedRelation',
    schema: createEmbeddedRelationTransformerSchema,
    getName: (definitionContainer, definition) =>
      definitionContainer.nameFromId(definition.foreignRelationRef),
  }),
];
