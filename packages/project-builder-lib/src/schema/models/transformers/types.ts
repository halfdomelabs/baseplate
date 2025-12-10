import { z } from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { RefContextSlot } from '#src/references/ref-context-slot.js';
import type { def } from '#src/schema/creator/index.js';
import type { DefinitionSchemaParserContext } from '#src/schema/creator/types.js';

import type { modelEntityType } from '../types.js';

export const baseTransformerFields = {
  id: z.string(),
  type: z.string().min(1),
} as const;

export const baseTransformerSchema = z.looseObject(baseTransformerFields);

/** Slots required by model transformer schemas */
export interface ModelTransformerSlots {
  modelSlot: RefContextSlot<typeof modelEntityType>;
}

/**
 * Schema creator for model transformers that requires modelSlot.
 */
export type ModelTransformerSchemaCreator<T extends z.ZodType = z.ZodType> = (
  ctx: DefinitionSchemaParserContext,
  slots: ModelTransformerSlots,
) => T;

export interface ModelTransformerType<
  T extends ModelTransformerSchemaCreator = ModelTransformerSchemaCreator,
> {
  name: string;
  createSchema: T;
  getName: (
    definitionContainer: ProjectDefinitionContainer,
    definition: def.InferOutput<T>,
  ) => string;
}

export function createModelTransformerType<
  T extends ModelTransformerSchemaCreator,
>(payload: ModelTransformerType<T>): ModelTransformerType<T> {
  return payload;
}

export type TransformerConfig = z.infer<typeof baseTransformerSchema>;
