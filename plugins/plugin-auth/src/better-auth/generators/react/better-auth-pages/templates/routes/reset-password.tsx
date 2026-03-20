// @ts-nocheck

import { authClient } from '%betterAuthImports';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputFieldController,
} from '%reactComponentsImports';
import { logError } from '%reactErrorImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  beforeLoad: ({ context: { userId } }) => {
    if (userId) {
      throw redirect({ to: '/', replace: true });
    }
  },
  component: ResetPasswordPage,
});

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

function ResetPasswordPage(): React.JSX.Element {
  const { token } = Route.useSearch();
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
      .resetPassword({
        newPassword: data.newPassword,
        token,
      })
      .then(({ error }) => {
        if (error) {
          setFormError('newPassword', {
            message:
              error.message ??
              'Failed to reset password. The link may have expired.',
          });
          return;
        }
        setIsSuccess(true);
      })
      .catch((err: unknown) => {
        logError(err);
        setFormError('newPassword', {
          message: 'Sorry, something went wrong. Please try again.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm">
          <CardHeader>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request
              a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/auth/forgot-password"
              className="text-sm underline underline-offset-4"
            >
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-sm">
          <CardHeader>
            <CardTitle>Password reset successful</CardTitle>
            <CardDescription>
              Your password has been reset successfully. You can now log in with
              your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/auth/login"
              className="text-sm underline underline-offset-4"
            >
              Go to login
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
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <InputFieldController
                control={control}
                name="newPassword"
                label="New Password"
                type="password"
                autoComplete="new-password"
                placeholder="New password"
              />
              <InputFieldController
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Reset Password
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
