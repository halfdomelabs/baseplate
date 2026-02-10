import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { InputFieldController } from '@src/components/ui/input-field';
import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';
import { getApolloErrorCode } from '@src/utils/apollo-error';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './-constants';

export const Route = createFileRoute('/auth_/reset-password')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: ResetPasswordPage,
  beforeLoad: ({ search: { token }, context: { userId } }) => {
    if (userId) {
      throw redirect({ to: '/' });
    }
    if (!token) {
      throw redirect({ to: '/auth/forgot-password' });
    }
  },
});

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .max(PASSWORD_MAX_LENGTH),
    confirmPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .max(PASSWORD_MAX_LENGTH),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

const validateTokenMutation = graphql(`
  mutation ValidatePasswordResetToken(
    $input: ValidatePasswordResetTokenInput!
  ) {
    validatePasswordResetToken(input: $input) {
      valid
    }
  }
`);

const resetPasswordMutation = graphql(`
  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {
    resetPasswordWithToken(input: $input) {
      success
    }
  }
`);

function ResetPasswordPage(): React.JSX.Element {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);

  const [validateToken] = useMutation(validateTokenMutation);
  const [resetPassword, { loading }] = useMutation(resetPasswordMutation);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: 'onBlur',
  });

  // Validate token on mount
  useEffect(() => {
    if (token) {
      validateToken({
        variables: { input: { token } },
      })
        .then(({ data }) => {
          setTokenValid(data?.validatePasswordResetToken.valid ?? false);
        })
        .catch(() => {
          setTokenValid(false);
        });
    }
  }, [token, validateToken]);

  const onSubmit = (data: FormData): void => {
    if (!token) return;

    resetPassword({
      variables: {
        input: {
          token,
          newPassword: data.newPassword,
        },
      },
    })
      .then(() => {
        setResetComplete(true);
        toast.success('Password reset successful!');
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, [
          'invalid-token',
          'token-expired',
        ] as const);
        switch (errorCode) {
          case 'invalid-token':
          case 'token-expired': {
            setTokenValid(false);
            break;
          }
          default: {
            toast.error(
              logAndFormatError(
                err,
                'Sorry, we could not reset your password.',
              ),
            );
          }
        }
      });
  };

  // Loading state
  if (tokenValid === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validating...</CardTitle>
          <CardDescription>
            Please wait while we verify your reset link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Please request a
            new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/auth/forgot-password">
            <Button variant="secondary" className="w-full">
              Request New Link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Success state - redirect to login
  if (resetComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with
            your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              navigate({ to: '/auth/login' }).catch(logError);
            }}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Reset form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <InputFieldController
              control={control}
              name="newPassword"
              label="New Password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
            />
            <InputFieldController
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Reset Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
