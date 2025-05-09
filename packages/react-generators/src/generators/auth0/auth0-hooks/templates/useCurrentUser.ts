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

  const noUserError =
    data && data.TPL_USER === null ? new Error('No user found') : null;

  return {
    user: data?.TPL_USER ?? undefined,
    loading,
    error: error ?? noUserError,
  };
}
