import { DateResolver } from 'graphql-scalars';

import { builder } from '@src/plugins/graphql/builder.js';

/**
 * Date scalar type using graphql-scalars DateResolver.
 *
 * Represents a date in RFC 3339 format (YYYY-MM-DD).
 * Serializes Date objects to ISO date strings and parses RFC 3339 compliant date strings.
 * All dates are normalized to UTC.
 *
 * @example
 * // Input: "2023-12-25"
 * // Output: Date object at midnight UTC
 */
export const DateScalar = builder.addScalarType('Date', DateResolver, {});
