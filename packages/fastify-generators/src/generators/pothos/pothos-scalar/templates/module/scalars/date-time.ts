// @ts-nocheck

import { builder } from '%pothosImports';
import { DateTimeResolver } from 'graphql-scalars';

/**
 * DateTime scalar type using graphql-scalars DateTimeResolver.
 *
 * Represents an exact instant on the timeline in RFC 3339 format.
 * Accepts and serializes date-time strings with timezone information.
 * Non-UTC timezones are automatically shifted to UTC.
 *
 * @example
 * // Input: "2023-12-25T10:15:30Z"
 * // Output: Date object representing that exact instant
 *
 * @example
 * // Input: "2023-12-25T10:15:30+01:00"
 * // Output: "2023-12-25T09:15:30Z" (shifted to UTC)
 */
export const DateTimeScalar = builder.addScalarType(
  'DateTime',
  DateTimeResolver,
  {},
);
