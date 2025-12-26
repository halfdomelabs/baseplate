// @ts-nocheck

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
