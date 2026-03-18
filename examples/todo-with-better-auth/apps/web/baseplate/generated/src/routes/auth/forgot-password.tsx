import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { authClient } from '@src/services/auth-client';
import { logError } from '@src/services/error-logger';

export const Route = createFileRoute('/auth/forgot-password')({
  beforeLoad: ({ context: { userId } }) => {
    if (userId) {
      throw redirect({ to: '/', replace: true });
    }
  },
  component: ForgotPasswordPage,
});

const formSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});

type FormData = z.infer<typeof formSchema>;

function ForgotPasswordPage(): React.JSX.Element {
  const {
    control,
    handleSubmit,
    setError: setFormError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: 'onBlur',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = (data: FormData): void => {
    setIsSubmitting(true);
    authClient
      .requestPasswordReset({
        email: data.email,
        redirectTo: '/auth/reset-password',
      })
      .then(({ error }) => {
        if (error) {
          setFormError('email', {
            message: error.message ?? 'Failed to send reset email',
          });
          return;
        }
        setIsSuccess(true);
      })
      .catch((err: unknown) => {
        logError(err);
        setFormError('email', {
          message: 'Sorry, something went wrong. Please try again.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (isSuccess) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists with that email, we&apos;ve sent a password
              reset link. Please check your inbox and spam folder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/auth/login"
              className="text-sm underline underline-offset-4"
            >
              Back to login
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
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <InputFieldController
                control={control}
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Send Reset Link
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link to="/auth/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
