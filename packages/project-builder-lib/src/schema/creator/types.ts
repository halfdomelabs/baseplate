import type { z } from 'zod';

import type { PluginSpecStore } from '#src/plugins/index.js';
import type {
  RefContextType,
  WithEntType,
  WithExpressionType,
  WithRefType,
} from '#src/references/extend-parser-context-with-refs.js';
import type {
  RefContextSlotDefinition,
  RefContextSlotMap,
} from '#src/references/ref-context-slot.js';

import type { WithDefaultType } from './extend-parser-context-with-defaults.js';

/**
 * Options for creating a definition schema.
 */
export interface DefinitionSchemaCreatorOptions {
  /**
   * The plugin implementation store that contains the instantiated plugin spec implementations.
   */
  plugins: PluginSpecStore;
}

export interface DefinitionSchemaParserContext {
  /**
   * The plugin implementation store that contains the instantiated plugin spec implementations.
   */
  plugins: PluginSpecStore;
  /**
   * Adds a reference to the schema.
   */
  withRef: WithRefType;
  /**
   * Adds an entity to the schema.
   */
  withEnt: WithEntType;
  /**
   * Wraps a schema with default value handling. Uses prefault to ensure defaults
   * are populated during parsing, and registers the default so it can be stripped
   * during serialization via `cleanDefaultValues()`.
   */
  withDefault: WithDefaultType;
  /**
   * Creates ref context slots for use within a schema definition.
   * Slots provide type-safe context for parent-child entity relationships.
   */
  refContext: RefContextType;
  /**
   * Wraps a value with a ref expression parser for deferred validation.
   * The parser handles all parsing, validation, rename handling, and code generation.
   */
  withExpression: WithExpressionType;
}

export type DefinitionSchemaCreator<T extends z.ZodType = z.ZodType> = (
  ctx: DefinitionSchemaParserContext,
) => T;

export type DefinitionSchemaCreatorWithSlots<
  TDefinitionSchema extends z.ZodType = z.ZodType,
  TSlotDefinition extends RefContextSlotDefinition = RefContextSlotDefinition,
> = ((
  ctx: DefinitionSchemaParserContext,
  slots: RefContextSlotMap<TSlotDefinition>,
) => TDefinitionSchema) & {
  slotDefinition: TSlotDefinition;
};
