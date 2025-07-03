import { useMemo } from 'react';

import type { def, DefinitionSchemaCreator } from '#src/schema/index.js';

import { useProjectDefinition } from './use-project-definition.js';

export function useDefinitionSchema<T extends DefinitionSchemaCreator>(
  schemaCreator: T,
): def.InferSchema<T> {
  const { definitionSchemaParserContext } = useProjectDefinition();
  return useMemo(
    () => schemaCreator(definitionSchemaParserContext),
    [definitionSchemaParserContext, schemaCreator],
  ) as def.InferSchema<T>;
}
