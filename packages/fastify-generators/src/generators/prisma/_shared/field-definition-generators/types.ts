import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ServiceOutputDtoField } from '#src/types/service-output.js';

/**
 * Definition for a transformer instance attached to a field.
 * Only present on transform fields (file, nested), not scalars.
 */
export interface TransformerDefinition {
  /** Code fragment for the transformer instance (e.g., fileTransformer({...})) */
  fragment: TsCodeFragment;
  /** Whether this transformer needs the existing item on update (for .forUpdate(value, existingItem.fieldId)) */
  needsExistingItem?: boolean;
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
