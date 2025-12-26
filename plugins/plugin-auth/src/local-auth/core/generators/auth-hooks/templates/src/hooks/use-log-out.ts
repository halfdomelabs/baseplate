// @ts-nocheck

import { LogOutDocument } from '%generatedGraphqlImports';
import { logAndFormatError, logError } from '%reactErrorImports';
import { userSessionClient } from '%reactSessionImports';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export function useLogOut(): () => void {
  const [logOut] = useMutation(LogOutDocument);
  const navigate = useNavigate();

  return () => {
    logOut()
      .then(() => {
        userSessionClient.signOut();
        toast.success('You have been successfully logged out!');
        navigate({ to: '/' }).catch(logError);
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Sorry, we could not log you out.'));
      });
  };
}
