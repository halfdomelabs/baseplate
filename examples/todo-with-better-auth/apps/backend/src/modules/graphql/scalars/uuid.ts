import { UUIDResolver } from 'graphql-scalars';

import { builder } from '@src/plugins/graphql/builder.js';

/**
 * UUID scalar type using graphql-scalars UUIDResolver.
 *
 * Represents a Universally Unique Identifier (UUID) string.
 * Validates input strings to ensure they conform to UUID format.
 * Supports all UUID versions (v1, v3, v4, v5).
 *
 * @example
 * // Input: "123e4567-e89b-12d3-a456-426614174000"
 * // Output: "123e4567-e89b-12d3-a456-426614174000"
 */
export const UuidScalar = builder.addScalarType('Uuid', UUIDResolver, {});
