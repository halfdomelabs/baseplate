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

export const Route = createFileRoute('/auth/login')({
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
  component: LoginPage,
});

const formSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

type FormData = z.infer<typeof formSchema>;

function LoginPage(): React.JSX.Element {
  const {
    control,
    handleSubmit,
    resetField,
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
    authClient.signIn
      .email({
        email: data.email,
        password: data.password,
      })
      .then(({ error }) => {
        if (error) {
          resetField('password');
          setFormError(
            'password',
            { message: error.message ?? 'Invalid email or password' },
            { shouldFocus: true },
          );
          return;
        }
        router
          .invalidate()
          .then(() => router.navigate({ to: return_to ?? '/', replace: true }))
          .catch(logError);
      })
      .catch((err: unknown) => {
        logError(err);
        resetField('password');
        setFormError(
          'password',
          { message: 'Sorry, we could not log you in.' },
          { shouldFocus: true },
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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
              <InputFieldController
                control={control}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Login
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-4 text-center text-sm">
              <div>
                Don&apos;t have an account?{' '}
                <Link
                  to="/auth/register"
                  search={{ return_to }}
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
