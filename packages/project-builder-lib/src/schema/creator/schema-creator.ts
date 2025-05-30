import type { z } from 'zod';

import type {
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from './types.js';

export function definitionSchema<T extends z.ZodTypeAny>(
  creator: DefinitionSchemaCreator<T>,
): (options: DefinitionSchemaCreatorOptions) => T {
  return (options) => creator(options);
}
