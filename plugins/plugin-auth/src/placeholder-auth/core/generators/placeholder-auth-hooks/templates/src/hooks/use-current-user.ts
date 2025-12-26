// @ts-nocheck

import type { CurrentUserFragment } from '%generatedGraphqlImports';

import { useQuery } from '@apollo/client/react';

import { GetUserByIdDocument } from '%generatedGraphqlImports';
import { useSession } from '$useSession';

interface UseCurrentUserResult {
  user?: CurrentUserFragment;
  loading: boolean;
  error?: Error | undefined;
}

/**
 * Fetches information about the current user
 *
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
