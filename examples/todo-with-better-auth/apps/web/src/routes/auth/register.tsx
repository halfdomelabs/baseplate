import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router';
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

export const Route = createFileRoute('/auth/register')({
  validateSearch: z.object({
    return_to: z
      .string()
      .refine((v) => v.startsWith('/') && !v.startsWith('//'))
      .optional(),
  }),
  beforeLoad: ({ context: { userId }, search: { return_to } }) => {
    if (userId) {
      throw redirect({ to: return_to ?? '/', replace: true });
    }
  },
  component: RegisterPage,
});

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email().transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

function RegisterPage(): React.JSX.Element {
  const {
    control,
    handleSubmit,
    setError: setFormError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: 'onBlur',
  });
  const router = useRouter();
  const { return_to } = Route.useSearch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data: FormData): void => {
    setIsSubmitting(true);
    authClient.signUp
      .email({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      .then(({ error }) => {
        if (error) {
          setFormError('email', {
            message: error.message ?? 'Could not create account',
          });
          return;
        }
        router
          .invalidate()
          .then(() => router.navigate({ to: return_to ?? '/', replace: true }))
          .catch(logError);
      })
      .catch((err: unknown) => {
        logError(err);
        setFormError('email', {
          message: 'Sorry, we could not create your account.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <InputFieldController
                control={control}
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
              />
              <InputFieldController
                control={control}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
              />
              <InputFieldController
                control={control}
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Password"
              />
              <InputFieldController
                control={control}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Sign Up
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                search={{ return_to }}
                className="underline underline-offset-4"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
