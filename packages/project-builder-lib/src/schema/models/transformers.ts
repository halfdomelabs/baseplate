import { z } from 'zod';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldType,
} from './types.js';
import type { ProjectConfig } from '../projectConfig.js';
import { ReferencesBuilder } from '../references.js';
import { zRef, zRefBuilder } from '@src/references/index.js';
import { randomUid } from '@src/utils/randomUid.js';

const baseTransformerFields = {
  uid: z.string().default(randomUid),
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
  name: zRef(z.string(), {
    type: modelForeignRelationEntityType,
    onDelete: 'DELETE_PARENT',
    parentPath: { context: 'model' },
  }),
  type: z.literal('embeddedRelation'),
  embeddedFieldNames: z.array(
    zRef(z.string(), {
      type: modelScalarFieldType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'embeddedModel' },
    }),
  ),
  embeddedTransformerNames: z.array(z.string().min(1)).optional(),
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
  name: zRef(z.string(), {
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
    builder.addPathToContext('modelRef', modelEntityType, 'embeddedModel');
  },
);

export type TransformerConfig = z.infer<typeof transformerSchema>;

export function buildServiceTransformerReferences(
  originalConfig: ProjectConfig,
  modelName: string,
  transformer: TransformerConfig,
  builder: ReferencesBuilder<TransformerConfig>,
): void {
  builder.addReferenceable({
    category: 'modelTransformer',
    id: transformer.uid,
    key: `${modelName}#${transformer.name}`,
    name: transformer.name,
  });
}
