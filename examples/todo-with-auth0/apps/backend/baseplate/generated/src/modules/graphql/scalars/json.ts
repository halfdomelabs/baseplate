import { JSONResolver } from 'graphql-scalars';

import { builder } from '@src/plugins/graphql/builder.js';

/**
 * JSON scalar type using graphql-scalars JSONResolver.
 *
 * Represents any valid JSON value including objects, arrays, strings, numbers, booleans, and null.
 * Provides flexible data storage for dynamic content that doesn't need strict type checking.
 *
 * Use this when you need to store arbitrary JSON data structures.
 * For object-only JSON data, use JSONObject scalar instead.
 *
 * @example
 * // Input: { "key": "value", "nested": { "data": true } }
 * // Output: { "key": "value", "nested": { "data": true } }
 *
 * @example
 * // Input: ["item1", "item2", "item3"]
 * // Output: ["item1", "item2", "item3"]
 */
export const JSONScalar = builder.addScalarType('JSON', JSONResolver, {});
