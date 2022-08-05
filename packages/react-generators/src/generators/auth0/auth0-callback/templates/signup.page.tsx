// @ts-nocheck

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Button, Card, Spinner } from '%react-components';
import { logAndFormatError } from '%react-error/formatter';

function SignupPage(): JSX.Element {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [error, setError] = useState<string | null>(null);

  const redirectToSignup = useCallback((): void => {
    loginWithRedirect({ screen_hint: 'signup' }).catch((err) => {
      setError(logAndFormatError(err));
    });
  }, [loginWithRedirect]);

  useEffect(() => {
    if (!isAuthenticated) {
      redirectToSignup();
    }
  }, [isAuthenticated, redirectToSignup]);

  // if they are already authenticated, redirect them to home
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-100">
      {error ? (
        <Card className="space-y-4 p-4">
          <Alert type="error">{error}</Alert>
          <Button onClick={redirectToSignup}>Try Again</Button>
        </Card>
      ) : (
        <Spinner size="large" />
      )}
    </div>
  );
}

export default SignupPage;
