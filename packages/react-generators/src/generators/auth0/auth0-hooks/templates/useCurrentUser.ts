// @ts-nocheck

import type { CurrentUserFragment } from '%generatedGraphqlImports';

import { useGetUserByIdQuery } from '%generatedGraphqlImports';

import { useSession } from './useSession.js';

interface UseCurrentUserResult {
  user?: CurrentUserFragment;
  loading: boolean;
  error?: Error | null;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { userId } = useSession();
  const { data, loading, error } = useGetUserByIdQuery({
    variables: { id: userId ?? '' },
    skip: !userId,
  });

  const noUserError = !userId ? new Error('No user logged in') : null;

  return {
    user: data?.TPL_USER,
    loading,
    error: error ?? noUserError,
  };
}
