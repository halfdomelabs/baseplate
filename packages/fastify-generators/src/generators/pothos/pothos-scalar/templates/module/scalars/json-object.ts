// @ts-nocheck

import { builder } from '%pothosImports';
import { JSONObjectResolver } from 'graphql-scalars';

/**
 * JSONObject scalar type using graphql-scalars JSONObjectResolver.
 *
 * Represents a JSON object (key-value pairs) only.
 * Does NOT accept arrays, strings, numbers, booleans, or null.
 * Provides type-safe storage for structured object data.
 *
 * Use this when you specifically need JSON objects and want to reject non-object values.
 * For any valid JSON value (including arrays), use JSON scalar instead.
 *
 * @example
 * // Valid input: { "key": "value", "nested": { "data": true } }
 * // Output: { "key": "value", "nested": { "data": true } }
 *
 * @example
 * // Invalid input: ["item1", "item2"] (arrays not allowed)
 * // Invalid input: "string value" (primitives not allowed)
 */
export const JSONObjectScalar = builder.addScalarType(
  'JSONObject',
  JSONObjectResolver,
  {},
);
