import type { Paths } from 'type-fest';

import { z } from 'zod';

import type { DefinitionEntityType } from '#src/index.js';
import type { DefinitionSchemaCreatorOptions } from '#src/schema/index.js';

import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
  ZodBuilderFunction,
  ZodRefBuilderInterface,
} from './definition-ref-builder.js';
import type {
  AnyDefinitionEntityInput,
  DefinitionRefAnnotations,
  SlotContextPath,
} from './markers.js';
import type {
  RefContextSlotDefinition,
  RefContextSlotMap,
} from './ref-context-slot.js';

import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { createRefContextSlotMap } from './ref-context-slot.js';

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
  TObject extends z.ZodObject,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<z.input<TObject>>,
>(
  schema: TObject,
  entity: DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>,
) => ZodTypeWithOptional<TObject>;

export type WithRefBuilder = <T extends z.ZodType>(
  schema: T,
  builder?: ZodBuilderFunction<z.TypeOf<T>>,
) => ZodTypeWithOptional<T>;

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
) => TSchema;

export function extendParserContextWithRefs({
  transformReferences,
}: DefinitionSchemaCreatorOptions): {
  withRef: WithRefType;
  withEnt: WithEntType;
  withRefBuilder: WithRefBuilder;
  refContext: RefContextType;
} {
  function withRef<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<string, TEntityType>,
  ): z.ZodType<string, string> {
    return z.string().transform((value) => {
      if (transformReferences && value) {
        return new DefinitionReferenceMarker(
          value,
          reference,
        ) as unknown as string;
      }

      return value;
    });
  }

  function withEnt<
    TObject extends z.ZodObject,
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<z.input<TObject>>,
  >(
    schema: TObject,
    entity: DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>,
  ): ZodTypeWithOptional<TObject> {
    if (!('id' in schema.shape)) {
      throw new Error(
        `Entity must have an id field. Entity type: ${entity.type.name}. Schema keys: ${Object.keys(
          schema.shape,
        ).join(', ')}`,
      );
    }
    return schema.transform((value) => {
      // Check if the id is valid
      if (!('id' in value) || !entity.type.isId(value.id as string)) {
        throw new Error(
          `Invalid id for entity ${entity.type.name}. Id: ${value.id as string}`,
        );
      }
      if (transformReferences) {
        const existingAnnotations =
          REF_ANNOTATIONS_MARKER_SYMBOL in value
            ? (value[REF_ANNOTATIONS_MARKER_SYMBOL] as DefinitionRefAnnotations)
            : undefined;
        return {
          ...value,
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities: [...(existingAnnotations?.entities ?? []), entity],
            references: existingAnnotations?.references ?? [],
            slotContextPaths: existingAnnotations?.slotContextPaths ?? [],
          },
        };
      }
      return value;
    }) as unknown as ZodTypeWithOptional<TObject>;
  }

  function withRefBuilder<T extends z.ZodType>(
    schema: T,
    builder?: ZodBuilderFunction<z.output<T>>,
  ): ZodTypeWithOptional<T> {
    return schema.transform((value) => {
      if (!value) {
        return value;
      }
      if (typeof value !== 'object') {
        throw new TypeError(
          `refBuilder requires an object, but got ${typeof value}`,
        );
      }
      const existingAnnotations =
        REF_ANNOTATIONS_MARKER_SYMBOL in value
          ? (value[REF_ANNOTATIONS_MARKER_SYMBOL] as DefinitionRefAnnotations)
          : undefined;
      const entities = existingAnnotations?.entities ?? [];
      const references = existingAnnotations?.references ?? [];
      const slotContextPaths: SlotContextPath[] =
        existingAnnotations?.slotContextPaths ?? [];
      const refBuilder: ZodRefBuilderInterface<z.output<T>> = {
        addReference: (reference) => {
          references.push(reference);
        },
        addEntity: (entity) => {
          entities.push(entity as AnyDefinitionEntityInput);
        },
        addPathToContext: (path, slot) => {
          slotContextPaths.push({ path, type: slot.entityType, slot });
        },
      };
      builder?.(refBuilder, value as z.output<T>);
      if (transformReferences) {
        return {
          ...value,
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities,
            references,
            slotContextPaths,
          },
        };
      }

      return value;
    }) as unknown as ZodTypeWithOptional<T>;
  }

  return {
    withRef,
    withEnt,
    withRefBuilder,
    refContext,
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
): TSchema {
  const slots = createRefContextSlotMap(slotDefinition);
  return schemaBuilder(slots);
}
