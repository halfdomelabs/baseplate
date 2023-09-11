/* eslint-disable @typescript-eslint/no-explicit-any */
/**

Adapted from https://github.com/react-hook-form/react-hook-form/tree/master/src/types/path

MIT License

Copyright (c) 2019-present Beier(Bill) Luo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import { ArrayKey, IsTuple, TupleKeys } from './common.js';

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldValues = Record<string, any>;

/**
 * Helper type for recursively constructing paths through a type.
 * See {@link Path}
 */
type PathImpl<K extends string | number, V> = V extends Primitive
  ? `${K}`
  : `${K}` | `${K}.${Path<V>}`;

/**
 * Type which eagerly collects all paths through a type
 * @typeParam T - type which should be introspected
 * @example
 * ```
 * Path<{foo: {bar: string}}> = 'foo' | 'foo.bar'
 * ```
 */
export type Path<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathImpl<K & string, T[K]>;
      }[TupleKeys<T>]
    : PathImpl<ArrayKey, V>
  : {
      [K in keyof T]-?: PathImpl<K & string, T[K]>;
    }[keyof T];

/**
 * See {@link Path}
 */
export type FieldPath<TFieldValues extends FieldValues> = Path<TFieldValues>;

/**
 * Helper type for recursively constructing paths through a type.
 * See {@link ArrayPath}
 */
type ArrayPathImpl<K extends string | number, V> = V extends Primitive
  ? never
  : V extends readonly (infer U)[]
  ? U extends Primitive
    ? never
    : `${K}` | `${K}.${ArrayPath<V>}`
  : `${K}.${ArrayPath<V>}`;

/**
 * Type which eagerly collects all paths through a type which point to an array
 * type.
 * @typeParam T - type which should be introspected
 * @example
 * ```
 * Path<{foo: {bar: string[], baz: number[]}}> = 'foo.bar' | 'foo.baz'
 * ```
 */
export type ArrayPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathImpl<K & string, T[K]>;
      }[TupleKeys<T>]
    : ArrayPathImpl<ArrayKey, V>
  : {
      [K in keyof T]-?: ArrayPathImpl<K & string, T[K]>;
    }[keyof T];

/**
 * See {@link ArrayPath}
 */
export type FieldArrayPath<TFieldValues extends FieldValues> =
  ArrayPath<TFieldValues>;

/**
 * Type to evaluate the type which the given path points to.
 * @typeParam T - deeply nested type which is indexed by the path
 * @typeParam P - path into the deeply nested type
 * @example
 * ```
 * PathValue<{foo: {bar: string}}, 'foo.bar'> = string
 * PathValue<[number, string], '1'> = string
 * ```
 */
export type PathValue<T, P extends Path<T> | ArrayPath<T>> = T extends any
  ? P extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K]>
        ? PathValue<T[K], R>
        : never
      : K extends `${ArrayKey}`
      ? T extends readonly (infer V)[]
        ? PathValue<V, R & Path<V>>
        : never
      : never
    : P extends keyof T
    ? T[P]
    : P extends `${ArrayKey}`
    ? T extends readonly (infer V)[]
      ? V
      : never
    : never
  : never;

/**
 * See {@link PathValue}
 */
export type FieldPathValue<
  TFieldValues extends FieldValues,
  TFieldPath extends FieldPath<TFieldValues>,
> = PathValue<TFieldValues, TFieldPath>;

/**
 * See {@link PathValue}
 */
export type FieldArrayPathValue<
  TFieldValues extends FieldValues,
  TFieldArrayPath extends FieldArrayPath<TFieldValues>,
> = PathValue<TFieldValues, TFieldArrayPath>;

/**
 * Type to evaluate the type which the given paths point to.
 * @typeParam TFieldValues - field values which are indexed by the paths
 * @typeParam TPath        - paths into the deeply nested field values
 * @example
 * ```
 * FieldPathValues<{foo: {bar: string}}, ['foo', 'foo.bar']>
 *   = [{bar: string}, string]
 * ```
 */
export type FieldPathValues<
  TFieldValues extends FieldValues,
  TPath extends FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[],
  // eslint-disable-next-line @typescript-eslint/ban-types
> = {} & {
  [K in keyof TPath]: FieldPathValue<
    TFieldValues,
    TPath[K] & FieldPath<TFieldValues>
  >;
};

/** Glob Path Addition to be able to do foo.*.name */

/**
 * Helper type for recursively constructing paths through a type.
 * See {@link Path}
 */
type GlobPathImpl<K extends string | number, V> = V extends Primitive
  ? `${K}`
  : `${K}` | `${K}.${GlobPath<V>}`;

/**
 * Type which eagerly collects all paths through a type
 * @typeParam T - type which should be introspected
 * @example
 * ```
 * Path<{foo: {bar: string}}> = 'foo' | 'foo.bar'
 * ```
 */
export type GlobPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: GlobPathImpl<K & string, T[K]>;
      }[TupleKeys<T>]
    : GlobPathImpl<ArrayKey | '*', V>
  : {
      [K in keyof T]-?: GlobPathImpl<K & string, T[K]>;
    }[keyof T];

/**
 * See {@link Path}
 */
export type GlobFieldPath<TFieldValues extends FieldValues> =
  GlobPath<TFieldValues>;

/**
 * Type to evaluate the type which the given path points to.
 * @typeParam T - deeply nested type which is indexed by the path
 * @typeParam P - path into the deeply nested type
 * @example
 * ```
 * PathValue<{foo: {bar: string}}, 'foo.bar'> = string
 * PathValue<[number, string], '1'> = string
 * ```
 */
export type GlobPathValue<T, P extends GlobPath<T>> = T extends any
  ? P extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends GlobPath<T[K]>
        ? GlobPathValue<T[K], R>
        : never
      : K extends `${ArrayKey}` | '*'
      ? T extends readonly (infer V)[]
        ? GlobPathValue<V, R & GlobPath<V>>
        : never
      : never
    : P extends keyof T
    ? T[P]
    : P extends `${ArrayKey}` | '*'
    ? T extends readonly (infer V)[]
      ? V
      : never
    : never
  : never;

/**
 * See {@link PathValue}
 */
export type GlobFieldPathValue<
  TFieldValues extends FieldValues,
  TFieldPath extends GlobFieldPath<TFieldValues>,
> = GlobPathValue<TFieldValues, TFieldPath>;
