import { z } from 'zod';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from './types.js';
import { zRef, zRefBuilder } from '@src/references/index.js';

const baseTransformerFields = {
  id: z.string().default(() => modelTransformerEntityType.generateNewId()),
  name: z.string().min(1),
  type: z.string().min(1),
} as const;

export const passwordTransformerSchema = z.object({
  ...baseTransformerFields,
  type: z.literal('password'),
});

export type PasswordTransformerConfig = z.infer<
  typeof passwordTransformerSchema
>;

export const embeddedRelationTransformerSchema = z.object({
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
});

export type EmbeddedRelationTransformerConfig = z.infer<
  typeof embeddedRelationTransformerSchema
>;

// TODO: Remove file transformers if storage is disabled

export const fileTransformerSchema = z.object({
  ...baseTransformerFields,
  fileRelationRef: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'DELETE_PARENT',
    parentPath: { context: 'model' },
  }),
  type: z.literal('file'),
});

export type FileTransformerConfig = z.infer<typeof fileTransformerSchema>;

export const transformerSchema = zRefBuilder(
  z.discriminatedUnion('type', [
    passwordTransformerSchema,
    embeddedRelationTransformerSchema,
    fileTransformerSchema,
  ]),
  (builder) => {
    builder.addEntity({
      type: modelTransformerEntityType,
      parentPath: { context: 'model' },
      processPostSerialize(input) {
        let newName = input.name;
        switch (input.type) {
          case 'embeddedRelation':
            newName = input.foreignRelationRef;
            break;
          case 'file':
            newName = input.fileRelationRef;
            break;
        }
        return {
          ...input,
          name: newName,
        };
      },
    });
    builder.addPathToContext('modelRef', modelEntityType, 'embeddedModel');
  },
);

export type TransformerConfig = z.infer<typeof transformerSchema>;
