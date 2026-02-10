import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
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

import { PASSWORD_MAX_LENGTH } from './-constants';

export const Route = createFileRoute('/auth_/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: ({ context: { userId } }) => {
    if (userId) {
      throw redirect({ to: '/' });
    }
  },
});

const formSchema = z.object({
  email: z
    .email()
    .max(PASSWORD_MAX_LENGTH)
    .transform((value) => value.toLowerCase()),
});

type FormData = z.infer<typeof formSchema>;

const requestPasswordResetMutation = graphql(`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
    }
  }
`);

function ForgotPasswordPage(): React.JSX.Element {
  const [submitted, setSubmitted] = useState(false);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: 'onBlur',
  });
  const [requestReset, { loading }] = useMutation(requestPasswordResetMutation);

  const onSubmit = (data: FormData): void => {
    requestReset({
      variables: {
        input: { email: data.email },
      },
    })
      .then(() => {
        setSubmitted(true);
      })
      .catch((err: unknown) => {
        toast.error(
          logAndFormatError(err, 'Sorry, we could not process your request.'),
        );
      });
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists with that email, we&apos;ve sent you a password
            reset link. The link will expire in 1 hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm">
            <Link to="/auth/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <InputFieldController
              control={control}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="user@example.com"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Send Reset Link
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link to="/auth/login" className="underline underline-offset-4">
              Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
