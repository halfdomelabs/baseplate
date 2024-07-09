import { z } from 'zod';

import { baseTransformerFields, createModelTransformerType } from './types.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from '../types.js';
import { zEnt, zRef } from '@src/references/index.js';

export const passwordTransformerSchema = zEnt(
  z.object({
    ...baseTransformerFields,
    type: z.literal('password'),
  }),
  {
    type: modelTransformerEntityType,
    parentPath: { context: 'model' },
    name: 'password',
  },
);

export type PasswordTransformerConfig = z.infer<
  typeof passwordTransformerSchema
>;

export const embeddedRelationTransformerSchema = zEnt(
  z.object({
    ...baseTransformerFields,
    foreignRelationRef: zRef(z.string(), {
      type: modelForeignRelationEntityType,
      onDelete: 'DELETE_PARENT',
      parentPath: { context: 'model' },
    }),
    type: z.literal('embeddedRelation'),
    embeddedFieldNames: z.array(
      zRef(z.string(), {
        type: modelScalarFieldEntityType,
        onDelete: 'RESTRICT',
        parentPath: { context: 'embeddedModel' },
      }),
    ),
    embeddedTransformerNames: z
      .array(
        zRef(z.string(), {
          type: modelTransformerEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'embeddedModel' },
        }),
      )
      .optional(),
    modelRef: zRef(z.string(), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
  }),
  {
    type: modelTransformerEntityType,
    parentPath: { context: 'model' },
    nameRefPath: 'foreignRelationRef',
  },
).refBuilder((builder) =>
  builder.addPathToContext('modelRef', modelEntityType, 'embeddedModel'),
);

export type EmbeddedRelationTransformerConfig = z.infer<
  typeof embeddedRelationTransformerSchema
>;

export const BUILT_IN_TRANSFORMERS = [
  createModelTransformerType({
    name: 'password',
    schema: passwordTransformerSchema,
    getName: () => 'Password',
  }),
  createModelTransformerType({
    name: 'embeddedRelation',
    schema: embeddedRelationTransformerSchema,
    getName: (definitionContainer, definition) => {
      return definitionContainer.nameFromId(definition.foreignRelationRef);
    },
  }),
];
