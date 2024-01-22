import { z } from 'zod';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from './types.js';
import { zodRefDiscriminatedUnionType } from '@src/references/discriminated-union.js';
import { zEnt, zRef } from '@src/references/index.js';

const baseTransformerFields = {
  id: z.string().default(() => modelTransformerEntityType.generateNewId()),
  type: z.string().min(1),
} as const;

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

// TODO: Remove file transformers if storage is disabled

export const fileTransformerSchema = zEnt(
  z.object({
    ...baseTransformerFields,
    fileRelationRef: zRef(z.string(), {
      type: modelLocalRelationEntityType,
      onDelete: 'DELETE_PARENT',
      parentPath: { context: 'model' },
    }),
    type: z.literal('file'),
  }),
  {
    type: modelTransformerEntityType,
    parentPath: { context: 'model' },
    nameRefPath: 'fileRelationRef',
  },
);

export type FileTransformerConfig = z.infer<typeof fileTransformerSchema>;

export const transformerSchema = zodRefDiscriminatedUnionType('type', [
  passwordTransformerSchema,
  embeddedRelationTransformerSchema,
  fileTransformerSchema,
]);

export type TransformerConfig = z.infer<typeof transformerSchema>;
