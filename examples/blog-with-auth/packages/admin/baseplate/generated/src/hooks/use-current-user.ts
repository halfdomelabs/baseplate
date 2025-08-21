import { useQuery } from '@apollo/client';

import type { CurrentUserFragment } from '../generated/graphql';

import { GetUserByIdDocument } from '../generated/graphql';
import { useSession } from './use-session';

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
  const { userId } = useSession();
  const { data, loading, error } = useQuery(GetUserByIdDocument, {
    variables: { id: userId ?? '' },
    skip: !userId,
  });

  const noUserError = !userId ? new Error('No user logged in') : undefined;

  return {
    user: data?.user,
    loading,
    error: error ?? noUserError,
  };
}
