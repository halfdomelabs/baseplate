// @ts-nocheck

import type { CurrentUserFragment } from '%generatedGraphqlImports';

import { useSession } from '$useSession';
import { GetUserByIdDocument } from '%generatedGraphqlImports';
import { useQuery } from '@apollo/client';

/**
 * Result returned by useCurrentUser hook
 */
export interface UseCurrentUserResult {
  /** Current user data from GraphQL */
  user?: CurrentUserFragment;
  /** Whether user data is loading */
  loading: boolean;
  /** Any error that occurred while fetching user data */
  error?: Error | undefined;
}

/**
 * Fetches information about the current user via GraphQL
 * @returns A result containing the current user or an error if the user is not authenticated
 */
export function useCurrentUser(): UseCurrentUserResult {
  const session = useSession();
  const { data, loading, error } = useQuery(GetUserByIdDocument, {
    variables: { id: session?.userId ?? '' },
    skip: !session,
  });

  const noUserError = !session ? new Error('No user logged in') : undefined;

  return {
    user: data?.user,
    loading,
    error: error ?? noUserError,
  };
}
