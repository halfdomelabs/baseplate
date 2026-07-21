import { CombinedGraphQLErrors } from '@apollo/client/errors';

export function getApolloErrorCode<T extends readonly string[]>(
  error: unknown,
  allowedCodes: T,
): T[number] | null {
  // get error code from CombinedGraphQLErrors
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const gqlError = error.errors.find(
    (err) =>
      err.extensions?.code &&
      allowedCodes.includes(err.extensions.code as string),
  );
  return (gqlError?.extensions?.code as T[number] | undefined) ?? null;
}

/**
 * Gets the error code and its structured data for an error matching one of the
 * allowed codes.
 *
 * The server sends the details behind an error (e.g. which file types a category
 * accepts) as structured data rather than only in the message, so the client can
 * word the message itself. Prefer this over showing the server's message
 * verbatim, which cannot be translated.
 *
 * @param error The error thrown by Apollo.
 * @param allowedCodes The error codes to match against.
 * @returns The matched code and its data, or null if no allowed code matched.
 */
export function getApolloErrorDetails<T extends readonly string[]>(
  error: unknown,
  allowedCodes: T,
): { code: T[number]; data: Record<string, unknown> } | null {
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
    data: (gqlError.extensions.extraData ?? {}) as Record<string, unknown>,
  };
}
