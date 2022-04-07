// @ts-nocheck

import { ApolloError } from '@apollo/client';

export function getApolloErrorCode<T extends Readonly<string[]>>(
  error: unknown,
  allowedCodes: T
): T[number] | null {
  // get error code from ApolloError
  if (!(error instanceof ApolloError)) {
    return null;
  }
  const gqlError = error.graphQLErrors.find((err) =>
    allowedCodes.includes(err.extensions?.code as string)
  );
  return (gqlError?.extensions?.code as T[number]) || null;
}
