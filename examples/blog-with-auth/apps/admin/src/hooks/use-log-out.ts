import { useMutation } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { LogOutDocument } from '../generated/graphql';
import { logAndFormatError } from '../services/error-formatter';
import { logError } from '../services/error-logger';
import { userSessionClient } from '../services/user-session-client';

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
