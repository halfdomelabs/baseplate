import type { z } from 'zod';

import type { PluginImplementationStore } from '#src/plugins/index.js';
import type { zEnt, zRef, zRefBuilder } from '#src/references/ref-builder.js';

/**
 * Options for creating a definition schema.
 */
export interface DefinitionSchemaCreatorOptions {
  /**
   * The plugin implementation store that contains the instantiated plugin spec implementations.
   */
  plugins: PluginImplementationStore;
  /**
   * If true, the schema will be transformed to include references.
   */
  transformReferences?: boolean;
}

export interface DefinitionSchemaParserContext {
  /**
   * The plugin implementation store that contains the instantiated plugin spec implementations.
   */
  plugins: PluginImplementationStore;
  /**
   * If true, the schema will be transformed to include references.
   */
  transformReferences?: boolean;
  /**
   * Adds a zRef
   */
  withRef: typeof zRef;
  /**
   * Adds a zEnt
   */
  withEnt: typeof zEnt;
  /**
   * Adds a zRefBuilder
   */
  withRefBuilder: typeof zRefBuilder;
}

export type DefinitionSchemaCreator<T extends z.ZodTypeAny = z.ZodTypeAny> = (
  ctx: DefinitionSchemaParserContext,
) => T;
