import type { TuplePaths } from '@baseplate-dev/utils';

import { get } from 'es-toolkit/compat';
import { z } from 'zod';

import type { DefinitionEntityType } from '#src/index.js';
import type { DefinitionSchemaCreatorOptions } from '#src/schema/index.js';

import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
} from './definition-ref-builder.js';
import type {
  ExpressionSlotMap,
  RefExpressionParser,
} from './expression-types.js';
import type {
  DefinitionEntityAnnotation,
  DefinitionRefAnnotations,
} from './markers.js';
import type {
  RefContextSlot,
  RefContextSlotDefinition,
  RefContextSlotMap,
} from './ref-context-slot.js';

import {
  DefinitionExpressionMarker,
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { createRefContextSlotMap } from './ref-context-slot.js';
import { stripRefMarkers } from './strip-ref-markers.js';

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
  // Overload for parsers with no required slots
  <TValue, TParseResult>(
    parser: RefExpressionParser<TValue, TParseResult>,
  ): z.ZodType<TValue, TValue>;

  // Overload for parsers with required slots
  <
    TValue,
    TParseResult,
    TRequiredSlots extends Record<string, DefinitionEntityType>,
  >(
    parser: RefExpressionParser<TValue, TParseResult, TRequiredSlots>,
    slots: ExpressionSlotMap<TRequiredSlots>,
  ): z.ZodType<TValue, TValue>;
}

export function extendParserContextWithRefs({
  transformReferences,
}: DefinitionSchemaCreatorOptions): {
  withRef: WithRefType;
  withEnt: WithEntType;
  refContext: RefContextType;
  withExpression: WithExpressionType;
} {
  function modifyAnnotations(
    value: unknown,
    ctx: z.RefinementCtx,
    modifier: (
      annotations: DefinitionRefAnnotations,
    ) => DefinitionRefAnnotations,
  ): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') {
      ctx.addIssue({
        code: 'invalid_type',
        expected: 'object',
        message: `Entity must be an object`,
        input: value,
      });
      return value;
    }
    if (transformReferences) {
      const existingAnnotations =
        REF_ANNOTATIONS_MARKER_SYMBOL in value
          ? (value[REF_ANNOTATIONS_MARKER_SYMBOL] as DefinitionRefAnnotations)
          : { entities: [], references: [], slots: [] };
      return {
        ...value,
        [REF_ANNOTATIONS_MARKER_SYMBOL]: modifier(existingAnnotations),
      };
    }
    return value;
  }

  function withRef<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<TEntityType>,
  ): z.ZodType<string, string> {
    return z.string().transform((value) => {
      if (transformReferences && value) {
        return new DefinitionReferenceMarker(value, {
          path: [],
          type: reference.type,
          onDelete: reference.onDelete,
          parentSlot: reference.parentSlot,
          provides: reference.provides,
        }) as unknown as string;
      }

      return value;
    });
  }

  function withEnt<
    TType extends z.ZodType,
    TEntityType extends DefinitionEntityType,
    TIdPath extends TuplePaths<z.output<TType>> | undefined = undefined,
  >(
    schema: TType,
    entity: DefinitionEntityInput<z.output<TType>, TEntityType, TIdPath>,
  ): ZodTypeWithOptional<TType> {
    return schema.transform((value, ctx) => {
      if (value === null || value === undefined) return value;
      if (transformReferences) {
        if (typeof value !== 'object') {
          ctx.addIssue({
            code: 'invalid_type',
            expected: 'object',
            message: `Entity must be an object`,
            input: value,
          });
          return value;
        }
        // Check if the id is valid
        const idPath = entity.idPath ?? ['id'];
        const id = get(value, idPath) as unknown;
        if (typeof id !== 'string' || !id || !entity.type.isId(id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Unable to find string id field '${entity.idPath?.join('.') ?? 'id'}' in entity ${entity.type.name}`,
            input: value,
          });
          return value;
        }

        const nameResolver = (() => {
          if (entity.getNameResolver) {
            return entity.getNameResolver(stripRefMarkers(value));
          }
          if (!('name' in value) || typeof value.name !== 'string') {
            ctx.addIssue({
              code: 'custom',
              message: `Unable to find string name field in entity ${entity.type.name}`,
              input: value,
            });
            return 'invalid';
          }
          return value.name;
        })();

        const newEntity: DefinitionEntityAnnotation = {
          id,
          idPath,
          path: [],
          type: entity.type,
          nameResolver,
          parentSlot: entity.parentSlot,
          provides: entity.provides,
        };
        return modifyAnnotations(value, ctx, (annotations) => ({
          ...annotations,
          entities: [...annotations.entities, newEntity],
        }));
      }
      return value;
    }) as unknown as ZodTypeWithOptional<TType>;
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
    return schemaBuilder(slots).transform((value, ctx) =>
      modifyAnnotations(value, ctx, (annotations) => ({
        ...annotations,
        slots: [
          ...annotations.slots,
          ...Object.values(slots).map((slot: RefContextSlot) => ({
            path: [],
            slot,
          })),
        ],
      })),
    ) as unknown as ZodTypeWithOptional<TSchema>;
  }

  /**
   * Wraps a value with a ref expression parser for deferred validation.
   * The parser handles all parsing, validation, and rename handling.
   *
   * If the parser declares required slots (via TRequiredSlots), they must be
   * provided as the second argument. TypeScript enforces this at compile time.
   *
   * The parser's `schema` property is used for input validation.
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
  function withExpression<
    TValue,
    TParseResult,
    TRequiredSlots extends Record<string, DefinitionEntityType>,
  >(
    parser: RefExpressionParser<TValue, TParseResult, TRequiredSlots>,
    slots?: ExpressionSlotMap<TRequiredSlots>,
  ): z.ZodType<TValue, TValue> {
    return parser.schema.transform((value) => {
      if (transformReferences && value !== undefined) {
        return new DefinitionExpressionMarker(value, {
          path: [],
          value,
          parser,
          slots,
        }) as unknown as TValue;
      }
      return value;
    }) as z.ZodType<TValue, TValue>;
  }

  return {
    withRef,
    withEnt,
    refContext,
    withExpression,
  };
}
