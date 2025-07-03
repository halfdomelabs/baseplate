import type { z } from 'zod';

import type { PluginImplementationStore } from '#src/plugins/index.js';
import type {
  WithEntType,
  WithRefBuilder,
  WithRefType,
} from '#src/references/extend-parser-context-with-refs.js';

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
   *
   * Note: The parsed data will not match the Typescript type definition of the schema
   * because refs will be replaced with special marker classes. You must call extractRefs
   * to convert the parsed data to the correct type.
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
   * Adds a reference to the schema.
   */
  withRef: WithRefType;
  /**
   * Adds an entity to the schema.
   */
  withEnt: WithEntType;
  /**
   * Provides access to the reference builder functions for the schema.
   */
  withRefBuilder: WithRefBuilder;
}

export type DefinitionSchemaCreator<T extends z.ZodTypeAny = z.ZodTypeAny> = (
  ctx: DefinitionSchemaParserContext,
) => T;
