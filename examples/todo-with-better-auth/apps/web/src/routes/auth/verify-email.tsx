import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/ui/card';
import { authClient } from '@src/services/auth-client';
import { logError } from '@src/services/error-logger';

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage(): React.JSX.Element {
  const { token } = Route.useSearch();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    token ? undefined : 'No verification token provided.',
  );

  useEffect(() => {
    if (!token) return;

    authClient
      .verifyEmail({
        token,
      })
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          setErrorMessage(
            error.message ?? 'Verification failed. The link may have expired.',
          );
          return;
        }
        setStatus('success');
        // Refresh session to reflect verified email
        router.invalidate().catch(logError);
      })
      .catch((err: unknown) => {
        logError(err);
        setStatus('error');
        setErrorMessage('Sorry, something went wrong. Please try again.');
      });
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm">
          <CardHeader>
            <CardTitle>Verifying your email...</CardTitle>
            <CardDescription>
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm">
          <CardHeader>
            <CardTitle>Verification failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className="text-sm underline underline-offset-4">
              Go to homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-sm">
        <CardHeader>
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>
            Your email address has been verified successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className="text-sm underline underline-offset-4">
            Go to homepage
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
