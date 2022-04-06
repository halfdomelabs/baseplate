// @ts-nocheck

import { useToast } from '%react-components/useToast';
import { useLogOutMutation } from '%react-apollo/generated';
import { authService } from '%auth-service';
import { formatError } from '%react-error/formatter';
import { logger } from '%react-logger';

export function useLogOut(): () => void {
  const [logOut] = useLogOutMutation();
  const toast = useToast();

  return () => {
    // TODO: Figure out how to catch log out errors
    logOut()
      .then(() => {
        authService.setAuthPayload(null);
        toast.success('You have been successfully logged out!');
      })
      .catch((err) => {
        toast.error(formatError(err, 'Sorry, we could not log you out.'));
        logger.error(err);
      });
  };
}
