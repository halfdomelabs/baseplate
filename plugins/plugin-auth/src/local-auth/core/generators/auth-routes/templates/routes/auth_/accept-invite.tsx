// @ts-nocheck

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '$constants';
import { getApolloErrorCode } from '%apolloErrorImports';
import { graphql } from '%graphqlImports';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputFieldController,
} from '%reactComponentsImports';
import { logAndFormatError, logError } from '%reactErrorImports';
import { userSessionClient } from '%reactSessionImports';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/auth_/accept-invite')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: AcceptInvitePage,
  beforeLoad: ({ search: { token }, context: { userId } }) => {
    if (userId) {
      throw redirect({ to: '/' });
    }
    if (!token) {
      throw redirect({ to: '/auth/login' });
    }
  },
});

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      )
      .max(PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

const validateInviteTokenMutation = graphql(`
  mutation ValidateInviteToken($input: ValidateInviteTokenInput!) {
    validateInviteToken(input: $input) {
      email
    }
  }
`);

const acceptInviteMutation = graphql(`
  mutation AcceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      session {
        userId
        roles
      }
    }
  }
`);

function AcceptInvitePage(): React.JSX.Element {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [validateInviteToken] = useMutation(validateInviteTokenMutation);
  const [acceptInvite, { loading }] = useMutation(acceptInviteMutation);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: 'onBlur',
  });

  const runTokenValidation = useCallback(() => {
    if (!token) return;

    setTokenValid(null);
    setValidationError(null);

    validateInviteToken({
      variables: { input: { token } },
    })
      .then(({ data }) => {
        setTokenValid(true);
        setEmail(data?.validateInviteToken.email ?? null);
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, ['invalid-token'] as const);
        switch (errorCode) {
          case 'invalid-token': {
            setTokenValid(false);
            break;
          }
          case null: {
            setValidationError(
              logAndFormatError(
                err,
                'Sorry, we could not validate your invite link.',
              ),
            );
          }
        }
      });
  }, [token, validateInviteToken]);

  // Validate token on mount
  useEffect(() => {
    runTokenValidation();
  }, [runTokenValidation]);

  const onSubmit = (data: FormData): void => {
    if (!token) return;

    acceptInvite({
      variables: {
        input: {
          token,
          newPassword: data.newPassword,
        },
      },
    })
      .then(({ data }) => {
        if (!data) {
          throw new Error('No data returned from accept invite mutation');
        }
        const { userId, roles } = data.acceptInvite.session;
        userSessionClient.signIn(userId, roles);

        navigate({ to: '/', replace: true }).catch(logError);
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, ['invalid-token'] as const);
        switch (errorCode) {
          case 'invalid-token': {
            setTokenValid(false);
            break;
          }
          case null: {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not accept your invite.'),
            );
          }
        }
      });
  };

  // Loading state
  if (tokenValid === null && !validationError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validating...</CardTitle>
          <CardDescription>
            Please wait while we verify your invite link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Validation error state (transient failures, not invalid token)
  if (validationError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Something Went Wrong</CardTitle>
          <CardDescription>{validationError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full"
            onClick={runTokenValidation}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid or Expired Invite</CardTitle>
          <CardDescription>
            This invite link is invalid or has expired. Please ask an admin to
            send you a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/auth/login">
            <Button variant="secondary" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Set password form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>
          {email
            ? `Choose a password to finish setting up ${email}.`
            : 'Choose a password to finish setting up your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <InputFieldController
              control={control}
              name="newPassword"
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter a password"
            />
            <InputFieldController
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Get Started
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
