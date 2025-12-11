import type { Paths } from 'type-fest';

import { get } from 'es-toolkit/compat';
import { z } from 'zod';

import type { DefinitionEntityType } from '#src/index.js';
import type { DefinitionSchemaCreatorOptions } from '#src/schema/index.js';

import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
} from './definition-ref-builder.js';
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
  reference: DefinitionReferenceInput<string, TEntityType>,
) => z.ZodType<string, string>;

type PathInput<Type> = Exclude<Paths<Type>, number>;

export type WithEntType = <
  TType extends z.ZodType,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<z.output<TType>>,
  TIdKey extends PathInput<z.output<TType>>,
>(
  schema: TType,
  entity: DefinitionEntityInput<z.output<TType>, TEntityType, TPath, TIdKey>,
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

export function extendParserContextWithRefs({
  transformReferences,
}: DefinitionSchemaCreatorOptions): {
  withRef: WithRefType;
  withEnt: WithEntType;
  refContext: RefContextType;
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
    reference: DefinitionReferenceInput<string, TEntityType>,
  ): z.ZodType<string, string> {
    return z
      .string()
      .refine((val) => reference.type.isId(val), {
        error: `Invalid id for entity ${reference.type.name}`,
      })
      .transform((value) => {
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
    TPath extends PathInput<z.output<TType>>,
    TIdKey extends PathInput<z.output<TType>>,
  >(
    schema: TType,
    entity: DefinitionEntityInput<z.output<TType>, TEntityType, TPath, TIdKey>,
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
        const id = get(value, entity.idPath ?? 'id');
        if (typeof id !== 'string' || !id || !entity.type.isId(id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Unable to find string id field '${entity.idPath ?? 'id'}' in entity ${entity.type.name}`,
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

  return {
    withRef,
    withEnt,
    refContext,
  };
}
