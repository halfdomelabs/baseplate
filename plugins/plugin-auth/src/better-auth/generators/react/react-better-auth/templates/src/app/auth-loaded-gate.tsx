// @ts-nocheck

import { useEffect } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Loader,
} from '%reactComponentsImports';
import { logError } from '%reactErrorImports';

import { useLogOut } from '%authHooksImports';

import { authClient } from '$authClient';

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
