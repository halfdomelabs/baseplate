import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';

const baseTransformerFields = {
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  type: yup.string().required(),
} as const;

export const passwordTransformerSchema = yup.object({
  ...baseTransformerFields,
  type: yup.mixed<'password'>().oneOf(['password']).required(),
});

export type PasswordTransformerConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof passwordTransformerSchema>
>;

export const embeddedRelationTransformerSchema = yup.object({
  ...baseTransformerFields,
  type: yup.mixed<'embeddedRelation'>().oneOf(['embeddedRelation']).required(),
  embeddedFieldNames: yup.array(yup.string().required()),
  embeddedTransformerNames: yup.array(yup.string().required()),
});

export type EmbeddedRelationTransformerConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof embeddedRelationTransformerSchema>
>;

export type TransformerConfig =
  | PasswordTransformerConfig
  | EmbeddedRelationTransformerConfig;
