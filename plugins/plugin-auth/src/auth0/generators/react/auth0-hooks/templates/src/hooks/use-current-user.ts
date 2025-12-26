// @ts-nocheck

import type { CurrentUserFragment } from '%generatedGraphqlImports';

import { useQuery } from '@apollo/client/react';

import { GetUserByIdDocument } from '%generatedGraphqlImports';
import { useSession } from '$useSession';

interface UseCurrentUserResult {
  user?: CurrentUserFragment;
  loading: boolean;
  error?: Error | null;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { userId } = useSession();
  const { data, loading, error } = useQuery(GetUserByIdDocument, {
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
