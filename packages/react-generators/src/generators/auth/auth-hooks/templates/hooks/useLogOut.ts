import { useToast } from "./useToast";
import { useLogOutMutation } from "src/generated/graphql";
import { authService } from "src/services/auth/auth";
import { formatError } from "src/services/error-formatter";
import { logger } from "src/services/logger";

export function useLogOut(): () => void {
  const [logOut] = useLogOutMutation();
  const toast = useToast();

  return () => {
    // TODO: Figure out how to catch log out errors
    logOut()
      .then(() => {
        authService.setAuthPayload(null);
        toast.success("You have been successfully logged out!");
      })
      .catch((err) => {
        toast.error(formatError(err, "Sorry, we could not log you out."));
        logger.error(err);
      });
  };
}
