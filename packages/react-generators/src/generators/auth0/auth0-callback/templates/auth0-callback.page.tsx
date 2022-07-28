// @ts-nocheck

import { OAuthError, useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Spinner } from '%react-components';
import { useLogOut } from '%auth-hooks/useLogOut';
import { logError } from '%react-error/logger';

function formatAndReportAuthError(error: unknown): string {
  if (
    error instanceof OAuthError &&
    error.error === 'access_denied' &&
    error.error_description?.includes('INVALID_ROLE')
  ) {
    return 'You do not have permission to access this page.';
  }
  logError(error);
  return 'Sorry, we could not log you in. Please try again.';
}

function Auth0Callback(): JSX.Element {
  const logOut = useLogOut();
  const navigate = useNavigate();

  const { handleRedirectCallback } = useAuth0();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleRedirectCallback()
      .then(({ appState }: { appState?: { returnTo?: string } }) => {
        navigate(appState?.returnTo || window.location.pathname);
      })
      .catch((err) => {
        setError(formatAndReportAuthError(err));
      });
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="h-full flex items-center justify-center bg-gray-100">
      {error ? (
        <Card className="space-y-4 p-4">
          <Alert type="error">{error}</Alert>
          <Button onClick={logOut}>Try Again</Button>
        </Card>
      ) : (
        <Spinner size="large" />
      )}
    </div>
  );
}

export default Auth0Callback;
