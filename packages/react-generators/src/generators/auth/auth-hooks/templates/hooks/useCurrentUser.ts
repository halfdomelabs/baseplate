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
    variables: { id: userId || '' },
    skip: !userId,
  });

  const noUserError =
    data && data.userById === null ? new Error('No user found') : null;

  return {
    user: data?.userById || undefined,
    loading,
    error: error || noUserError,
  };
}
