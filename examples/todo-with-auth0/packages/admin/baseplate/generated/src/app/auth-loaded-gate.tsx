import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Loader } from '../components/ui/loader';
import { logError } from '../services/error-logger';

function isInvalidRoleError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'error' in error &&
    'error_description' in error &&
    typeof error.error_description === 'string' &&
    error.error === 'access_denied' &&
    error.error_description.includes('INVALID_ROLE')
  );
}

function formatAuthError(error: unknown): {
  title: string;
  description: string;
} {
  if (isInvalidRoleError(error)) {
    return {
      title: 'You do not have permission to access this page.',
      description: 'Please contact support if you believe this is an error.',
    };
  }
  return {
    title: 'Sorry, we could not log you in.',
    description: 'Please try logging out and logging in again.',
  };
}

/**
 * A component that waits for the Auth0 client to be loaded before rendering its children.
 *
 * @param children - The children to render when the Auth0 client is loaded.
 * @returns The children or a loading indicator (with optional error message) if the Auth0 client is not loaded.
 */
export function AuthLoadedGate({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isLoading, error, logout } = useAuth0();

  useEffect(() => {
    if (error) {
      logError(error);
    }
  }, [error]);

  if (error) {
    const { title, description } = formatAuthError(error);
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm space-y-4 p-4">
          <Alert variant="error">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </Alert>
          <Button onClick={() => logout()}>Log Out</Button>
        </Card>
      </div>
    );
  }
  if (isLoading) return <Loader />;

  return <>{children}</>;
}
