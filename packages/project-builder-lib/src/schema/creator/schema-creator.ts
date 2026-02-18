import type { z } from 'zod';

import type {
  RefContextSlotDefinition,
  RefContextSlotMap,
} from '#src/references/ref-context-slot.js';

import { extendParserContextWithRefs } from '#src/references/extend-parser-context-with-refs.js';
import { createRefContextSlotMap } from '#src/references/ref-context-slot.js';

import type {
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
  DefinitionSchemaCreatorWithSlots,
  DefinitionSchemaParserContext,
} from './types.js';

import { extendParserContextWithDefaults } from './extend-parser-context-with-defaults.js';

export function createDefinitionSchemaParserContext(
  options: DefinitionSchemaCreatorOptions,
): DefinitionSchemaParserContext {
  return {
    ...options,
    ...extendParserContextWithRefs(),
    ...extendParserContextWithDefaults(options),
  };
}

export function definitionSchema<T extends z.ZodType>(
  creator: DefinitionSchemaCreator<T>,
): (context: DefinitionSchemaParserContext) => T {
  return (context) => creator(context);
}

/**
 * Creates a schema that requires slots to be passed from parent schemas.
 * Used when a schema needs to reference entities from a parent context.
 *
 * @example
 * ```typescript
 * // Child schema requiring modelSlot from parent
 * export const createModelScalarFieldSchema = definitionSchemaWithSlots(
 *   { modelSlot: modelEntityType },
 *   (ctx, { modelSlot }) =>
 *     ctx.withEnt(schema, {
 *       type: modelScalarFieldEntityType,
 *       parentSlot: modelSlot,
 *     }),
 * );
 *
 * // Called from parent:
 * createModelScalarFieldSchema(ctx, { modelSlot: parentModelSlot })
 * ```
 */
export function definitionSchemaWithSlots<
  TSlotDef extends RefContextSlotDefinition,
  T extends z.ZodType,
>(
  slotDefinition: TSlotDef,
  creator: (
    ctx: DefinitionSchemaParserContext,
    slots: RefContextSlotMap<TSlotDef>,
  ) => T,
): DefinitionSchemaCreatorWithSlots<T, TSlotDef> {
  const creatorWithSlots: DefinitionSchemaCreatorWithSlots<T, TSlotDef> = (
    context,
    slots,
  ) => creator(context, slots);
  creatorWithSlots.slotDefinition = slotDefinition;
  return creatorWithSlots;
}

/**
 * Wraps a schema creator that requires slots with placeholder slots,
 * producing a simple schema creator that can be used for validation-only
 * contexts (e.g., React Hook Form).
 *
 * The placeholder slots allow the schema to parse without actual parent context,
 * which is useful when you only need schema validation without ref extraction.
 *
 * @example
 * ```typescript
 * // Schema that normally requires modelSlot from parent
 * const createModelScalarFieldSchema = definitionSchemaWithSlots(
 *   { modelSlot: modelEntityType },
 *   (ctx, { modelSlot }) => ctx.withEnt(schema, { parentSlot: modelSlot }),
 * );
 *
 * // For React Hook Form validation, wrap with placeholder slots
 * const fieldSchema = withPlaceholderSlots(createModelScalarFieldSchema);
 * const zodSchema = fieldSchema(ctx); // No slots needed
 * ```
 */
export function withPlaceholderSlots<
  T extends z.ZodType,
  TSlotDef extends RefContextSlotDefinition,
>(
  schemaCreator: DefinitionSchemaCreatorWithSlots<T, TSlotDef>,
): DefinitionSchemaCreator<T> {
  return (ctx) => {
    const placeholderSlots = createRefContextSlotMap(
      schemaCreator.slotDefinition,
    );
    return schemaCreator(ctx, placeholderSlots);
  };
}
