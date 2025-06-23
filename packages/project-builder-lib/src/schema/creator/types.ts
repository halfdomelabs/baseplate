import type { z } from 'zod';

import type { PluginImplementationStore } from '#src/plugins/index.js';

export interface DefinitionSchemaCreatorOptions {
  plugins: PluginImplementationStore;
}

interface DefinitionSchemaParserContext {
  plugins: PluginImplementationStore;
}

export type DefinitionSchemaCreator<T extends z.ZodTypeAny = z.ZodTypeAny> = (
  ctx: DefinitionSchemaParserContext,
) => T;
