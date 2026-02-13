import { useMutation } from '@apollo/client/react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/ui/card';
import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';
import { getApolloErrorCode } from '@src/utils/apollo-error';

export const Route = createFileRoute('/auth_/verify-email')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: VerifyEmailPage,
  beforeLoad: ({ search: { token } }) => {
    if (!token) {
      throw redirect({ to: '/' });
    }
  },
});

const verifyEmailMutation = graphql(`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      success
    }
  }
`);

const requestEmailVerificationMutation = graphql(`
  mutation RequestEmailVerification {
    requestEmailVerification {
      success
    }
  }
`);

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

function VerifyEmailPage(): React.JSX.Element {
  const { token } = Route.useSearch();
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerifyStatus>(
    userId ? 'verifying' : 'idle',
  );

  const [verifyEmail] = useMutation(verifyEmailMutation);
  const [requestVerification, { loading: resending }] = useMutation(
    requestEmailVerificationMutation,
  );

  const doVerify = useCallback((): void => {
    if (!token) return;

    setStatus('verifying');
    verifyEmail({
      variables: { input: { token } },
    })
      .then(() => {
        setStatus('success');
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, [
          'invalid-token',
          'token-expired',
        ] as const);
        switch (errorCode) {
          case 'invalid-token':
          case 'token-expired': {
            setStatus('error');
            break;
          }
          default: {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not verify your email.'),
            );
            setStatus('error');
          }
        }
      });
  }, [token, verifyEmail]);

  // If logged in, auto-verify on mount
  useEffect(() => {
    if (userId && token) {
      doVerify();
    }
  }, [userId, token, doVerify]);

  const handleResend = (): void => {
    requestVerification()
      .then(() => {
        toast.success('Verification email sent! Check your inbox.');
      })
      .catch((err: unknown) => {
        toast.error(
          logAndFormatError(err, 'Could not resend verification email.'),
        );
      });
  };

  // Verifying state
  if (status === 'verifying') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifying...</CardTitle>
          <CardDescription>
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>
            Your email address has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              navigate({ to: '/' }).catch(logError);
            }}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription>
            This verification link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {userId ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={resending}
                onClick={handleResend}
              >
                Resend Verification Email
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  navigate({ to: '/auth/login' }).catch(logError);
                }}
              >
                Log In to Resend
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Idle state (not logged in) — show button to verify
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Click the button below to verify your email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={doVerify}>
          Verify Email
        </Button>
      </CardContent>
    </Card>
  );
}
