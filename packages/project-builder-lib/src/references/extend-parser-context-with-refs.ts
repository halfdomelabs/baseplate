import type { TuplePaths } from '@baseplate-dev/utils';

import { z } from 'zod';

import type { DefinitionEntityType } from '#src/index.js';
import type { PluginSpecStore } from '#src/plugins/index.js';

import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
} from './definition-ref-builder.js';
import type { ExpressionParserRef } from './expression-parser-ref.js';
import type { ExpressionSlotMap } from './expression-types.js';
import type {
  RefContextSlot,
  RefContextSlotDefinition,
  RefContextSlotMap,
} from './ref-context-slot.js';

import { definitionRefRegistry } from './definition-ref-registry.js';
import { expressionParserSpec } from './expression-parser-spec.js';
import { RefExpressionParser } from './expression-types.js';
import { createRefContextSlotMap } from './ref-context-slot.js';

type ZodTypeWithOptional<T extends z.ZodType> = T extends z.ZodOptional
  ? z.ZodOptional<z.ZodType<z.output<T>, z.input<T>>>
  : T extends z.ZodDefault
    ? z.ZodDefault<z.ZodType<z.output<T>, z.input<T>>>
    : T extends z.ZodPrefault
      ? z.ZodPrefault<z.ZodType<z.output<T>, z.input<T>>>
      : z.ZodType<z.output<T>, z.input<T>>;

export type WithRefType = <TEntityType extends DefinitionEntityType>(
  reference: DefinitionReferenceInput<TEntityType>,
) => z.ZodType<string, string>;

export type WithEntType = <
  TType extends z.ZodType,
  TEntityType extends DefinitionEntityType,
  TIdPath extends TuplePaths<z.output<TType>> | undefined = undefined,
>(
  schema: TType,
  entity: DefinitionEntityInput<z.output<TType>, TEntityType, TIdPath>,
) => ZodTypeWithOptional<TType>;

/**
 * Creates ref context slots for use within a schema definition.
 * Slots provide type-safe context for parent-child entity relationships.
 */
export type RefContextType = <
  TSlotDef extends RefContextSlotDefinition,
  TSchema extends z.ZodType,
>(
  slotDefinition: TSlotDef,
  schemaBuilder: (slots: RefContextSlotMap<TSlotDef>) => TSchema,
) => ZodTypeWithOptional<TSchema>;

/**
 * Wraps a value with a ref expression parser for deferred validation.
 * The parser handles all parsing, validation, and rename handling.
 *
 * If the parser declares required slots (via TRequiredSlots), they must be
 * provided as the second argument. TypeScript enforces this at compile time.
 */
export interface WithExpressionType {
  // Overload for direct parser with no required slots
  <TValue, TParseResult>(
    parser: RefExpressionParser<TValue, TParseResult>,
  ): z.ZodType<TValue, TValue>;

  // Overload for direct parser with required slots
  <
    TValue,
    TParseResult,
    TRequiredSlots extends Record<string, DefinitionEntityType>,
  >(
    parser: RefExpressionParser<TValue, TParseResult, TRequiredSlots>,
    slots: ExpressionSlotMap<TRequiredSlots>,
  ): z.ZodType<TValue, TValue>;

  // Overload for parser ref with no required slots
  <TValue>(parserRef: ExpressionParserRef<TValue>): z.ZodType<TValue, TValue>;

  // Overload for parser ref with required slots
  <TValue, TRequiredSlots extends Record<string, DefinitionEntityType>>(
    parserRef: ExpressionParserRef<TValue, TRequiredSlots>,
    slots: ExpressionSlotMap<TRequiredSlots>,
  ): z.ZodType<TValue, TValue>;
}

/**
 * Creates a string schema annotated as a reference to another entity.
 *
 * Can be used standalone:
 * ```typescript
 * withRef({ type: modelEnumEntityType, onDelete: 'RESTRICT' })
 * ```
 *
 * Or on the parser context:
 * ```typescript
 * ctx.withRef({ type: modelEnumEntityType, onDelete: 'RESTRICT' })
 * ```
 */
export function withRef<TEntityType extends DefinitionEntityType>(
  reference: DefinitionReferenceInput<TEntityType>,
): z.ZodType<string, string> {
  const schema = z.string().min(1);
  definitionRefRegistry.add(schema, {
    kind: 'reference',
    type: reference.type,
    onDelete: reference.onDelete,
    parentSlot: reference.parentSlot,
    provides: reference.provides,
  });
  return schema;
}

/**
 * Creates a schema decorator that marks a schema as defining an entity.
 *
 * Can be used with `.apply()`:
 * ```typescript
 * schema.apply(withEnt({ type: modelEntityType, provides: modelSlot }))
 * ```
 *
 * Or via the parser context (2-arg legacy form):
 * ```typescript
 * ctx.withEnt(schema, { type: modelEntityType, provides: modelSlot })
 * ```
 *
 * @param entity - The entity definition input
 * @returns A function that decorates a schema with entity metadata
 */
export function withEnt<TEntityType extends DefinitionEntityType>(
  entity: DefinitionEntityInput<unknown, TEntityType>,
): <TType extends z.ZodType>(schema: TType) => ZodTypeWithOptional<TType> {
  return <TType extends z.ZodType>(
    schema: TType,
  ): ZodTypeWithOptional<TType> => {
    const idPath = (entity.idPath as (string | number)[] | undefined) ?? ['id'];
    definitionRefRegistry.add(schema, {
      kind: 'entity',
      type: entity.type,
      idPath,
      getNameResolver: entity.getNameResolver as DefinitionEntityInput<
        z.output<TType>,
        TEntityType
      >['getNameResolver'],
      parentSlot: entity.parentSlot,
      provides: entity.provides,
    });
    return schema as unknown as ZodTypeWithOptional<TType>;
  };
}

/**
 * Creates ref context slots for use within a schema definition.
 * Slots provide type-safe context for parent-child entity relationships.
 *
 * @example
 * ```typescript
 * ctx.refContext(
 *   { modelSlot: modelEntityType },
 *   ({ modelSlot }) =>
 *     ctx.withEnt(schema, {
 *       type: modelEntityType,
 *       provides: modelSlot,
 *     }),
 * );
 * ```
 */
function refContext<
  TSlotDef extends RefContextSlotDefinition,
  TSchema extends z.ZodType,
>(
  slotDefinition: TSlotDef,
  schemaBuilder: (slots: RefContextSlotMap<TSlotDef>) => TSchema,
): ZodTypeWithOptional<TSchema> {
  const slots = createRefContextSlotMap(slotDefinition);
  const schema = schemaBuilder(slots);
  definitionRefRegistry.add(schema, {
    kind: 'ref-context',
    slots: Object.values(slots) as RefContextSlot[],
  });
  return schema as unknown as ZodTypeWithOptional<TSchema>;
}

/**
 * Wraps a value with a ref expression parser for deferred validation.
 * The parser handles all parsing, validation, and rename handling.
 *
 * If the parser declares required slots (via TRequiredSlots), they must be
 * provided as the second argument. TypeScript enforces this at compile time.
 *
 * The parser's `createSchema()` method is called to get a fresh schema
 * instance per call site, allowing per-call metadata to be registered
 * independently in the Baseplate registry.
 *
 * @example
 * ```typescript
 * // Parser without required slots
 * const expressionSchema = ctx.withExpression(simpleParser);
 *
 * // Parser with required slots (TypeScript enforces the second argument)
 * ctx.refContext(
 *   { modelSlot: modelEntityType },
 *   ({ modelSlot }) =>
 *     z.object({
 *       condition: ctx.withExpression(authorizerParser, { model: modelSlot }),
 *     })
 * );
 * ```
 */
/**
 * Creates a `withExpression` function that resolves parser refs eagerly
 * from the plugin spec store at schema construction time.
 */
function createWithExpression(plugins?: PluginSpecStore): WithExpressionType {
  // Implementation
  function withExpression(
    parserOrRef: // oxlint-disable-next-line typescript/no-explicit-any
      | RefExpressionParser<any, any, any>
      // oxlint-disable-next-line typescript/no-explicit-any
      | ExpressionParserRef<any, any>,
    // oxlint-disable-next-line typescript/no-explicit-any
    slots?: ExpressionSlotMap<any>,
  ): z.ZodType {
    // oxlint-disable-next-line typescript/no-explicit-any
    let parser: RefExpressionParser<any, any, any>;
    if (parserOrRef instanceof RefExpressionParser) {
      parser = parserOrRef;
    } else {
      // Resolve parser ref from plugin spec store
      if (!plugins) {
        throw new Error(
          `PluginSpecStore is required to resolve expression parser ref "${parserOrRef.name}". ` +
            `Ensure plugins are provided to createDefinitionSchemaParserContext.`,
        );
      }
      const specUse = plugins.use(expressionParserSpec);
      const resolved = specUse.getParser(parserOrRef.name);
      if (!resolved) {
        throw new Error(
          `Expression parser "${parserOrRef.name}" not found in expressionParserSpec. ` +
            `Ensure it is registered via a core module or plugin.`,
        );
      }
      parser = resolved;
    }

    const schema = parser.createSchema();
    definitionRefRegistry.add(schema, {
      kind: 'expression',
      parser,
      slots,
    });
    return schema;
  }
  return withExpression as WithExpressionType;
}

export function extendParserContextWithRefs(plugins?: PluginSpecStore): {
  withRef: WithRefType;
  withEnt: WithEntType;
  refContext: RefContextType;
  withExpression: WithExpressionType;
} {
  return {
    withRef,
    // Legacy 2-arg API that delegates to the standalone withEnt decorator.
    // Uses a cast because the standalone accepts DefinitionEntityInput<unknown, ...>
    // while this 2-arg form infers the full z.output<TType> for type-safe idPath.
    withEnt<
      TType extends z.ZodType,
      TEntityType extends DefinitionEntityType,
      TIdPath extends TuplePaths<z.output<TType>> | undefined = undefined,
    >(
      schema: TType,
      entity: DefinitionEntityInput<z.output<TType>, TEntityType, TIdPath>,
    ): ZodTypeWithOptional<TType> {
      return schema.apply(
        withEnt(entity as DefinitionEntityInput<unknown, TEntityType>),
      );
    },
    refContext,
    withExpression: createWithExpression(plugins),
  };
}
