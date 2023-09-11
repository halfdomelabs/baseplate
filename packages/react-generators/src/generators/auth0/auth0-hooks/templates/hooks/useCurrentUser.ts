// @ts-nocheck

import { useSession } from './useSession';
import {
  CurrentUserFragment,
  useGetUserByIdQuery,
} from '%react-apollo/generated';

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
    data && data.USER_QUERY === null ? new Error('No user found') : null;

  return {
    user: data?.USER_QUERY ?? undefined,
    loading,
    error: error ?? noUserError,
  };
}
