import type { z } from 'zod';

import { extendParserContextWithRefs } from '#src/references/extend-parser-context-with-refs.js';

import type {
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
  DefinitionSchemaParserContext,
} from './types.js';

export function createDefinitionSchemaParserContext(
  options: DefinitionSchemaCreatorOptions,
): DefinitionSchemaParserContext {
  return {
    ...options,
    ...extendParserContextWithRefs(options),
  };
}

export function definitionSchema<T extends z.ZodTypeAny>(
  creator: DefinitionSchemaCreator<T>,
): (context: DefinitionSchemaParserContext) => T {
  return (context) => creator(context);
}
