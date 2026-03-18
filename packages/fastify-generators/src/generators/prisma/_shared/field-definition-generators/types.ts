import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ServiceOutputDtoField } from '#src/types/service-output.js';

/**
 * Context variables passed to transformer fragment builders so they can
 * adapt code generation to different call sites (top-level vs nested).
 */
export interface TransformerFragmentContext {
  /** Reference to the transformers variable (e.g., 'todoItemTransformers' or an import fragment) */
  transformersVarFragment: TsCodeFragment | string;
  /** Variable name for the existing item in update operations (e.g., 'existingItem') */
  existingItemVarName: string;
  /**
   * Variable name for looking up existing related data in update operations.
   * Top-level: 'where' (the query arg), Nested: 'existingItem' (the nested existing item).
   */
  loadExistingVarName: string;
}

/**
 * Definition for a transformer instance attached to a field.
 * Only present on transform fields (file, nested), not scalars.
 */
export interface TransformerDefinition {
  /** Code fragment for the transformer instance (e.g., fileTransformer({...})) */
  fragment: TsCodeFragment;
  /**
   * Whether this transformer needs the top-level existing item loaded in update operations.
   * True for transformers that reference existingItem directly (e.g., file transformer reads existingItem.fileId).
   * False for transformers that handle their own data loading (e.g., nested transformers use loadExisting).
   */
  needsExistingItem?: boolean;
  /**
   * Builds the .forCreate() entry for this field in the transformers object.
   * E.g., `transformers.coverPhoto.forCreate(coverPhoto)`
   */
  buildForCreateEntry: (ctx: TransformerFragmentContext) => TsCodeFragment;
  /**
   * Builds the .forUpdate() entry for this field in the transformers object.
   * E.g., `transformers.coverPhoto.forUpdate(coverPhoto, existingItem.coverPhotoId)`
   */
  buildForUpdateEntry: (ctx: TransformerFragmentContext) => TsCodeFragment;
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
