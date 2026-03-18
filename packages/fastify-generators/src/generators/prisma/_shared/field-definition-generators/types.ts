import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ServiceOutputDtoField } from '#src/types/service-output.js';

/**
 * Describes how to generate the .forUpdate() call for this transformer.
 */
export type ForUpdatePattern =
  | {
      /**
       * Simple: .forUpdate(value, existingItem.fieldId)
       * Used by file transformers where the existing value is a scalar on the parent.
       */
      kind: 'existingField';
      /** The field name on existingItem (e.g., 'coverPhotoId') */
      existingFieldName: string;
    }
  | {
      /**
       * Load existing: .forUpdate(value, { loadExisting: () => prisma.model.findXxx(...) })
       * Used by nested transformers where the existing data is a separate entity.
       */
      kind: 'loadExisting';
      /** Code fragment for the loadExisting query (e.g., prisma.userProfile.findUnique({ where: { userId: where.id } })) */
      loadExistingFragment: TsCodeFragment;
    };

/**
 * Definition for a transformer instance attached to a field.
 * Only present on transform fields (file, nested), not scalars.
 */
export interface TransformerDefinition {
  /** Code fragment for the transformer instance (e.g., fileTransformer({...})) */
  fragment: TsCodeFragment;
  /** Whether this transformer needs the existing item on update */
  needsExistingItem?: boolean;
  /** How to generate the .forUpdate() second argument */
  forUpdatePattern?: ForUpdatePattern;
}

export interface InputFieldDefinitionOutput {
  /** Field name */
  name: string;
  /** Zod schema fragment for the fieldSchemas object (e.g., z.string(), fileInputSchema.nullish()) */
  schemaFragment: TsCodeFragment;
  /** Transformer definition. Only for transform fields (file, nested). */
  transformer?: TransformerDefinition;
  /** Whether this is a transform field (file, nested) vs a plain Zod schema entry */
  isTransformField: boolean;
  /** Output DTO field for service layer */
  outputDtoField: ServiceOutputDtoField;
}
