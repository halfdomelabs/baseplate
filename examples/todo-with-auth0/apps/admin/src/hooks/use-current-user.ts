import { useQuery } from '@apollo/client';

import type { CurrentUserFragment } from '../generated/graphql';

import { GetUserByIdDocument } from '../generated/graphql';
import { useSession } from './use-session';

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
    user: data?./* TPL_USER:START */ user /* TPL_USER:END */,
    loading,
    error: error ?? noUserError,
  };
}
