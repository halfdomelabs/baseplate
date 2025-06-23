import type { z } from 'zod';

import type { PluginImplementationStore } from '#src/plugins/index.js';

export interface DefinitionSchemaCreatorOptions {
  plugins: PluginImplementationStore;
}

interface DefinitionSchemaParserContext {
  plugins: PluginImplementationStore;
}

export type DefinitionSchemaCreator<T extends z.ZodTypeAny> = (
  ctx: DefinitionSchemaParserContext,
) => T;

export type InferSchema<T extends DefinitionSchemaCreator<z.ZodTypeAny>> =
  ReturnType<T>;

export type InferInput<T extends DefinitionSchemaCreator<z.ZodTypeAny>> =
  z.input<ReturnType<T>>;

export type InferOutput<T extends DefinitionSchemaCreator<z.ZodTypeAny>> =
  z.output<ReturnType<T>>;
