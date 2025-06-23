import type {
  def,
  DefinitionSchemaCreator,
} from '@baseplate-dev/project-builder-lib';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { useMemo } from 'react';

export function useDefinitionSchema<T extends DefinitionSchemaCreator>(
  schemaCreator: T,
): def.InferSchema<T> {
  const { definitionSchemaCreatorOptions } = useProjectDefinition();
  return useMemo(
    () => schemaCreator(definitionSchemaCreatorOptions),
    [definitionSchemaCreatorOptions, schemaCreator],
  ) as def.InferSchema<T>;
}
