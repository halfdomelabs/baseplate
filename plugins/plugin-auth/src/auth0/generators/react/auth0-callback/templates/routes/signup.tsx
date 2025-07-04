// @ts-nocheck

import type { ReactElement } from 'react';

import { Alert, Button, Card, Loader } from '%reactComponentsImports';
import { logAndFormatError, logError } from '%reactErrorImports';
import { useAuth0 } from '@auth0/auth0-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
});

function SignupPage(): ReactElement {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const redirectToSignup = useCallback((): void => {
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } }).catch(
      (err: unknown) => {
        setError(logAndFormatError(err));
      },
    );
  }, [loginWithRedirect]);

  useEffect(() => {
    if (!isAuthenticated) {
      redirectToSignup();
    } else {
      navigate({ to: '/' }).catch(logError);
    }
  }, [isAuthenticated, redirectToSignup, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      {error ? (
        <Card className="space-y-4 p-4">
          <Alert variant="error">{error}</Alert>
          <Button onClick={redirectToSignup}>Try Again</Button>
        </Card>
      ) : (
        <Loader />
      )}
    </div>
  );
}
