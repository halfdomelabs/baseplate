import { z } from 'zod';
import { randomUid } from '@src/utils/randomUid';

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

export const transformerSchema = z.discriminatedUnion('type', [
  passwordTransformerSchema,
  embeddedRelationTransformerSchema,
]);

export type TransformerConfig = z.infer<typeof transformerSchema>;
