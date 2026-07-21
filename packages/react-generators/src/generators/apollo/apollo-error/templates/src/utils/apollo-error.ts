// @ts-nocheck

import type { z } from 'zod';

import { CombinedGraphQLErrors } from '@apollo/client/errors';

/**
 * Returns the code and untrusted structured data for an error matching one of
 * the allowed codes, or null if none match.
 */
export function getApolloErrorDetails<T extends readonly string[]>(
  error: unknown,
  allowedCodes: T,
): { code: T[number]; data: unknown } | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const gqlError = error.errors.find(
    (err) =>
      err.extensions?.code &&
      allowedCodes.includes(err.extensions.code as string),
  );
  if (!gqlError?.extensions?.code) {
    return null;
  }
  return {
    code: gqlError.extensions.code as T[number],
    data: gqlError.extensions.extraData,
  };
}

/**
 * Returns the code for an error matching one of the allowed codes, or null if
 * none match.
 */
export function getApolloErrorCode<T extends readonly string[]>(
  error: unknown,
  allowedCodes: T,
): T[number] | null {
  return getApolloErrorDetails(error, allowedCodes)?.code ?? null;
}

/**
 * Matches an Apollo error against a `{ code: schema }` map and returns the
 * matched code with its data parsed by that code's schema.
 *
 * Returns null if no code matches. `data` is undefined if the payload fails its
 * schema. Give schemas optional fields so an absent payload still parses.
 */
export function getApolloErrorData<T extends Record<string, z.ZodType>>(
  error: unknown,
  schemas: T,
):
  | { [K in keyof T]: { code: K; data: z.output<T[K]> | undefined } }[keyof T]
  | null {
  const details = getApolloErrorDetails(
    error,
    Object.keys(schemas) as (keyof T & string)[],
  );
  if (!details) {
    return null;
  }
  const parsed = schemas[details.code].safeParse(details.data ?? {});
  return {
    code: details.code,
    data: parsed.success ? parsed.data : undefined,
  };
}
