// @ts-nocheck

import { LogOutDocument } from '%generatedGraphqlImports';
import { logAndFormatError, logError } from '%reactErrorImports';
import { useUserSessionClient } from '%reactSessionImports';
import { useApolloClient, useMutation } from '@apollo/client';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export function useLogOut(): () => void {
  const [logOut] = useMutation(LogOutDocument);
  const { client } = useUserSessionClient();
  const apolloClient = useApolloClient();
  const navigate = useNavigate();

  return () => {
    logOut()
      .then(() => {
        client.signOut();
        // Make sure to reset the Apollo client to clear any cached data
        apolloClient.clearStore().catch(logError);
        toast.success('You have been successfully logged out!');
        navigate({ to: '/' }).catch(logError);
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Sorry, we could not log you out.'));
      });
  };
}
