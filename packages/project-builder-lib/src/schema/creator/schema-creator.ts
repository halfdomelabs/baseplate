import type { z } from 'zod';

import { zEnt, zRef, zRefBuilder } from '#src/references/ref-builder.js';

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
    withRef: zRef,
    withEnt: zEnt,
    withRefBuilder: zRefBuilder,
  };
}

export function definitionSchema<T extends z.ZodTypeAny>(
  creator: DefinitionSchemaCreator<T>,
): (context: DefinitionSchemaParserContext) => T {
  return (context) => creator(context);
}
