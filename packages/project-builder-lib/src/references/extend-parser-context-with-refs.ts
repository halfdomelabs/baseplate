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
} from './markers.js';

import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';

export type WithRefType = <TEntityType extends DefinitionEntityType>(
  reference: DefinitionReferenceInput<string, TEntityType>,
) => z.ZodEffects<z.ZodString>;

type PathInput<Type> = Exclude<Paths<Type>, number>;

export type WithEntType = <
  TObject extends z.SomeZodObject,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<z.input<TObject>>,
>(
  schema: TObject,
  entity: DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>,
) => z.ZodEffects<TObject>;

export type WithRefBuilder = <T extends z.ZodType>(
  schema: T,
  builder?: ZodBuilderFunction<z.TypeOf<T>>,
) => z.ZodEffects<T>;

export function extendParserContextWithRefs({
  transformReferences,
}: DefinitionSchemaCreatorOptions): {
  withRef: WithRefType;
  withEnt: WithEntType;
  withRefBuilder: WithRefBuilder;
} {
  function withRef<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<string, TEntityType>,
  ): z.ZodEffects<z.ZodString> {
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
    TObject extends z.SomeZodObject,
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<z.input<TObject>>,
  >(
    schema: TObject,
    entity: DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>,
  ): z.ZodEffects<TObject> {
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
          `Invalid id for entity ${entity.type.name}. Id: ${value.id}`,
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
            contextPaths: existingAnnotations?.contextPaths ?? [],
          },
        };
      }
      return value;
    });
  }

  function withRefBuilder<T extends z.ZodType>(
    schema: T,
    builder?: ZodBuilderFunction<z.TypeOf<T>>,
  ): z.ZodEffects<T> {
    return schema.transform((value: unknown) => {
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
      const contextPaths = existingAnnotations?.contextPaths ?? [];
      const refBuilder: ZodRefBuilderInterface<z.TypeOf<T>> = {
        addReference: (reference) => {
          references.push(reference);
        },
        addEntity: (entity) => {
          entities.push(entity as AnyDefinitionEntityInput);
        },
        addPathToContext: (path, type, context) => {
          contextPaths.push({ path, type, context });
        },
      };
      builder?.(refBuilder, value);
      if (transformReferences) {
        return {
          ...value,
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities,
            references,
            contextPaths,
          },
        };
      }

      return value;
    });
  }

  return {
    withRef,
    withEnt,
    withRefBuilder,
  };
}
