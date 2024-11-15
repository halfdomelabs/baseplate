import type {
  AnyZodObject,
  input,
  output,
  ParseInput,
  ParseReturnType,
  Primitive,
  ProcessedCreateParams,
  RawCreateParams,
  ZodErrorMap,
  ZodRawShape,
  ZodTypeAny,
  ZodTypeDef,
} from 'zod';

import {
  addIssueToContext,
  INVALID,
  ZodDefault,
  ZodEffects,
  ZodEnum,
  ZodFirstPartyTypeKind,
  ZodIssueCode,
  ZodLazy,
  ZodLiteral,
  ZodNativeEnum,
  ZodNull,
  ZodObject,
  ZodParsedType,
  ZodType,
  ZodUndefined,
} from 'zod';

import { ZodRef } from './ref-builder.js';

// copied from https://github.com/colinhacks/zod/blob/dd849254d1149bc1f2ef0f47f0f7607955e4db85/src/types.ts

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * Helper for making discriminated unions out of Zod refs
 */

function processCreateParams(params: RawCreateParams): ProcessedCreateParams {
  if (!params) return {};
  const { errorMap, invalid_type_error, required_error, description } = params;
  if (errorMap && (invalid_type_error ?? required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) return { errorMap, description };
  const customMap: ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return { message: ctx.defaultError };
    if (ctx.data === undefined) {
      return { message: required_error ?? ctx.defaultError };
    }
    return { message: invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

const getDiscriminator = (type: ZodTypeAny): Primitive[] | null => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return Object.keys(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else {
    return null;
  }
};

type ZodRefDiscriminatedUnionOption<Discriminator extends string> =
  | ZodObject<Record<Discriminator, ZodTypeAny> & ZodRawShape>
  | (ZodTypeAny & {
      innerType: () => ZodObject<
        Record<Discriminator, ZodTypeAny> & ZodRawShape
      >;
    });

export interface ZodRefDiscriminatedUnionDef<
  Discriminator extends string,
  Options extends
    ZodRefDiscriminatedUnionOption<Discriminator>[] = ZodRefDiscriminatedUnionOption<Discriminator>[],
> extends ZodTypeDef {
  discriminator: Discriminator;
  options: Options;
  optionsMap: Map<Primitive, ZodRefDiscriminatedUnionOption<any>>;
  typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion;
}

function getInnerZodObject(type: ZodTypeAny): AnyZodObject {
  if (type instanceof ZodRef || type instanceof ZodEffects) {
    return getInnerZodObject(type.innerType());
  }
  if (!(type instanceof ZodObject)) {
    throw new TypeError(
      `Discriminated union option must be an object at root, got ${type.constructor.name}`,
    );
  }
  return type;
}

export class ZodRefDiscriminatedUnion<
  Discriminator extends string,
  Options extends ZodRefDiscriminatedUnionOption<Discriminator>[],
> extends ZodType<
  output<Options[number]>,
  ZodRefDiscriminatedUnionDef<Discriminator, Options>,
  input<Options[number]>
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input);

    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      });
      return INVALID;
    }

    const { discriminator } = this;

    const discriminatorValue: string = ctx.data[discriminator];

    const option = this.optionsMap.get(discriminatorValue);

    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: [...this.optionsMap.keys()],
        path: [discriminator],
      });
      return INVALID;
    }

    return ctx.common.async
      ? (option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }) as any)
      : (option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }) as any);
  }

  get discriminator(): Discriminator {
    return this._def.discriminator;
  }

  get options(): Options {
    return this._def.options;
  }

  get optionsMap(): Map<Primitive, ZodRefDiscriminatedUnionOption<any>> {
    return this._def.optionsMap;
  }

  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create<
    Discriminator extends string,
    Types extends [
      ZodRefDiscriminatedUnionOption<Discriminator>,
      ...ZodRefDiscriminatedUnionOption<Discriminator>[],
    ],
  >(
    discriminator: Discriminator,
    options: Types,
    params?: RawCreateParams,
  ): ZodRefDiscriminatedUnion<Discriminator, Types> {
    // Get all the valid discriminator values
    const optionsMap = new Map<
      Primitive,
      ZodRefDiscriminatedUnionOption<any>
    >();

    // try {
    for (const type of options) {
      const innerType = getInnerZodObject(type);
      const discriminatorValues = getDiscriminator(
        innerType.shape[discriminator],
      );
      if (!discriminatorValues) {
        throw new Error(
          `A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`,
        );
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(
            `Discriminator property ${String(
              discriminator,
            )} has duplicate value ${String(value)}`,
          );
        }

        optionsMap.set(value, type as ZodRefDiscriminatedUnionOption<any>);
      }
    }

    return new ZodRefDiscriminatedUnion<
      Discriminator,
      // DiscriminatorValue,
      Types
    >({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const zodRefDiscriminatedUnionType = ZodRefDiscriminatedUnion.create;
