import type {
  def,
  DefinitionSchemaCreator,
} from '@baseplate-dev/project-builder-lib';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { useMemo } from 'react';

export function useDefinitionSchema<T extends DefinitionSchemaCreator>(
  schemaCreator: T,
): def.InferSchema<T> {
  const { definitionSchemaParserContext } = useProjectDefinition();
  return useMemo(
    () => schemaCreator(definitionSchemaParserContext),
    [definitionSchemaParserContext, schemaCreator],
  ) as def.InferSchema<T>;
}
