import { z } from 'zod';
import { randomUid } from '@src/utils/randomUid';
import type { ProjectConfig } from '../projectConfig';
import { ReferencesBuilder } from '../references';

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
  type: z.literal('embeddedRelation'),
  embeddedFieldNames: z.array(z.string().min(1)),
  embeddedTransformerNames: z.array(z.string().min(1)).optional(),
});

export type EmbeddedRelationTransformerConfig = z.infer<
  typeof embeddedRelationTransformerSchema
>;

// TODO: Remove file transformers if storage is disabled

export const fileTransformerSchema = z.object({
  ...baseTransformerFields,
  type: z.literal('file'),
});

export type FileTransformerConfig = z.infer<typeof fileTransformerSchema>;

export const transformerSchema = z.discriminatedUnion('type', [
  passwordTransformerSchema,
  embeddedRelationTransformerSchema,
  fileTransformerSchema,
]);

export type TransformerConfig = z.infer<typeof transformerSchema>;

export function buildServiceTransformerReferences(
  originalConfig: ProjectConfig,
  modelName: string,
  transformer: TransformerConfig,
  builder: ReferencesBuilder<TransformerConfig>
): void {
  builder.addReferenceable({
    category: 'modelTransformer',
    id: transformer.uid,
    key: `${modelName}#${transformer.name}`,
    name: transformer.name,
  });

  if (transformer.type === 'embeddedRelation') {
    builder.addReference('name', {
      category: 'modelForeignRelation',
      key: `${modelName}#${transformer.name}`,
    });

    const localRelationName = transformer.name;
    const foreignModel = originalConfig.models?.find((model) =>
      model.model.relations?.some(
        (relation) =>
          relation.modelName === modelName &&
          relation.foreignRelationName === localRelationName
      )
    );

    if (!foreignModel) {
      throw new Error(
        `Could not find model associated with embedded relation ${modelName}/${localRelationName}`
      );
    }

    builder.addReferences('embeddedFieldNames.*', {
      category: 'modelField',
      generateKey: (name) => `${foreignModel.name}#${name}`,
    });
  }

  if (transformer.type === 'file') {
    builder.addReference('name', {
      category: 'modelLocalRelation',
      key: `${modelName}#${transformer.name}`,
    });
  }
}
