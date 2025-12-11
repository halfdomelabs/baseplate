import type { z } from 'zod';

import { useMemo } from 'react';

import type { RefContextSlotDefinition } from '#src/references/ref-context-slot.js';
import type {
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorWithSlots,
} from '#src/schema/index.js';

import { withPlaceholderSlots } from '#src/schema/index.js';

import { useProjectDefinition } from './use-project-definition.js';

/**
 * Hook to get a Zod schema from a definition schema creator.
 * Automatically handles schemas with slots by providing placeholder slots.
 */
export function useDefinitionSchema<T extends z.ZodType>(
  schemaCreator: DefinitionSchemaCreator<T>,
): T;
export function useDefinitionSchema<
  T extends z.ZodType,
  S extends RefContextSlotDefinition,
>(schemaCreator: DefinitionSchemaCreatorWithSlots<T, S>): T;
export function useDefinitionSchema(
  schemaCreator: DefinitionSchemaCreator | DefinitionSchemaCreatorWithSlots,
): z.ZodType {
  const { definitionSchemaParserContext } = useProjectDefinition();
  return useMemo(() => {
    if ('slotDefinition' in schemaCreator) {
      return withPlaceholderSlots(schemaCreator)(definitionSchemaParserContext);
    }
    return schemaCreator(definitionSchemaParserContext);
  }, [definitionSchemaParserContext, schemaCreator]);
}
