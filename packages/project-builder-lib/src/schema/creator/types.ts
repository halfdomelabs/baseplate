import type { z } from 'zod';

import type { PluginImplementationStore } from '#src/plugins/index.js';
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
  plugins: PluginImplementationStore;
  /**
   * If true, the schema will be transformed to include references.
   *
   * Note: The parsed data will not match the Typescript type definition of the schema
   * because refs will be replaced with special marker classes. You must call extractRefs
   * to convert the parsed data to the correct type.
   */
  transformReferences?: boolean;
  /**
   * How to handle default values in the schema.
   *
   * - 'populate': Ensure defaults are present (useful for React Hook Form)
   * - 'strip': Remove values that match their defaults (useful for clean JSON serialization)
   * - 'preserve': Keep values as-is without transformation
   *
   * @default 'populate'
   */
  defaultMode?: 'populate' | 'strip' | 'preserve';
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
   * How to handle default values in the schema.
   */
  defaultMode?: 'populate' | 'strip' | 'preserve';
  /**
   * Adds a reference to the schema.
   */
  withRef: WithRefType;
  /**
   * Adds an entity to the schema.
   */
  withEnt: WithEntType;
  /**
   * Wraps a schema with default value handling based on the defaultMode.
   * - 'populate': Uses preprocess to ensure defaults are present
   * - 'strip': Uses transform to remove values matching defaults
   * - 'preserve': Returns schema unchanged
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
