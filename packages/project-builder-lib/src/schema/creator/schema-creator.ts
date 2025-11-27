import type { z } from 'zod';

import { extendParserContextWithRefs } from '#src/references/extend-parser-context-with-refs.js';

import type {
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
  DefinitionSchemaParserContext,
} from './types.js';

import { extendParserContextWithDefaults } from './extend-parser-context-with-defaults.js';

export function createDefinitionSchemaParserContext(
  options: DefinitionSchemaCreatorOptions,
): DefinitionSchemaParserContext {
  return {
    ...options,
    ...extendParserContextWithRefs(options),
    ...extendParserContextWithDefaults(options),
  };
}

export function definitionSchema<T extends z.ZodType>(
  creator: DefinitionSchemaCreator<T>,
): (context: DefinitionSchemaParserContext) => T {
  return (context) => creator(context);
}
