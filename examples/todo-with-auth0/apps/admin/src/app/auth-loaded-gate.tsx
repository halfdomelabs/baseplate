import { useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Loader } from '../components/ui/loader';
import { useLogOut } from '../hooks/use-log-out';
import { authClient } from '../services/auth-client';
import { logError } from '../services/error-logger';

/**
 * A component that waits for the Better Auth session to be loaded before rendering its children.
 *
 * @param children - The children to render when the session is loaded.
 * @returns The children or a loading indicator (with optional error message) if the session is not loaded.
 */
export function AuthLoadedGate({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isPending, error } = authClient.useSession();
  const logOut = useLogOut();

  useEffect(() => {
    if (error) {
      logError(error);
    }
  }, [error]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm space-y-4 p-4">
          <Alert variant="error">
            <AlertTitle>Sorry, we could not log you in.</AlertTitle>
            <AlertDescription>
              Please try logging out and logging in again.
            </AlertDescription>
          </Alert>
          <Button onClick={logOut}>Log Out</Button>
        </Card>
      </div>
    );
  }

  if (isPending) return <Loader />;

  return <>{children}</>;
}
