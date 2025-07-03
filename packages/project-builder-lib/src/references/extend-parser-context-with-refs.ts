import type { Paths } from 'type-fest';
import type { z } from 'zod';

import type { DefinitionEntityType } from '#src/index.js';
import type { DefinitionSchemaCreatorOptions } from '#src/schema/index.js';

import type {
  AnyDefinitionEntityInput,
  DefinitionRefAnnotations,
} from './markers.js';
import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
  ZodBuilderFunction,
  ZodRef,
  ZodRefBuilderInterface,
} from './ref-builder.js';

import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { zRefBuilder } from './ref-builder.js';

export type WithRefType = <
  T extends z.ZodTypeAny,
  TEntityType extends DefinitionEntityType,
>(
  schema: T,
  reference: DefinitionReferenceInput<z.input<T>, TEntityType>,
) => z.ZodEffects<T>;

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
) => z.ZodEffects<ZodRef<T>>;

export function extendParserContextWithRefs({
  transformReferences,
}: DefinitionSchemaCreatorOptions): {
  withRef: WithRefType;
  withEnt: WithEntType;
  withRefBuilder: WithRefBuilder;
} {
  function withRef<
    T extends z.ZodType,
    TEntityType extends DefinitionEntityType,
  >(
    schema: T,
    reference: DefinitionReferenceInput<z.input<T>, TEntityType>,
  ): z.ZodEffects<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we can change this to zod string in the future
    return schema.transform((value) => {
      if (transformReferences && value) {
        return new DefinitionReferenceMarker(
          value as string,
          reference,
        ) as unknown as z.input<T>;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we can change this to zod string in the future
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

  function wrappedZRefBuilder<T extends z.ZodType>(
    schema: T,
    builder?: ZodBuilderFunction<z.TypeOf<T>>,
  ): z.ZodEffects<ZodRef<T>> {
    return zRefBuilder(schema, builder).transform((value) => {
      if (!value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we're returning a generic type
        return value;
      }
      if (typeof value !== 'object') {
        throw new TypeError(
          `zRefBuilder requires an object, but got ${typeof value}`,
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we're returning a generic type
        return {
          ...value,
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities,
            references,
            contextPaths,
          },
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we're returning a generic type
      return value;
    });
  }

  return {
    withRef,
    withEnt,
    withRefBuilder: wrappedZRefBuilder,
  };
}
