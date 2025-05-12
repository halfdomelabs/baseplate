import { ApolloError } from '@apollo/client';

export function getApolloErrorCode<T extends readonly string[]>(
  error: unknown,
  allowedCodes: T,
): T[number] | null {
  // get error code from ApolloError
  if (!(error instanceof ApolloError)) {
    return null;
  }
  const gqlError = error.graphQLErrors.find(
    (err) =>
      err.extensions?.code &&
      allowedCodes.includes(err.extensions.code as string),
  );
  return (gqlError?.extensions?.code as T[number] | undefined) ?? null;
}
