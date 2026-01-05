import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
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
import { userSessionClient } from '@src/services/user-session-client';
import { getApolloErrorCode } from '@src/utils/apollo-error';

export const Route = createFileRoute('/auth_/login')({
  validateSearch: z.object({
    return_to: z
      .string()
      .regex(/^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@?/]*$/)
      .optional(),
  }),
  component: LoginPage,
  beforeLoad: ({ search: { return_to }, context: { userId } }) => {
    if (userId) {
      throw redirect({ to: return_to ?? '/' });
    }
  },
});

const PASSWORD_MIN_LENGTH = 8;

const formSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

type FormData = z.infer<typeof formSchema>;

const loginWithEmailPasswordMutation = graphql(`
  mutation LoginWithEmailPassword($input: LoginWithEmailPasswordInput!) {
    loginWithEmailPassword(input: $input) {
      session {
        userId
      }
    }
  }
`);

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
  const [loginWithEmailPassword, { loading }] = useMutation(
    loginWithEmailPasswordMutation,
  );
  const navigate = useNavigate();
  const { return_to } = Route.useSearch();

  const onSubmit = (data: FormData): void => {
    loginWithEmailPassword({
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    })
      .then(({ data }) => {
        if (!data) {
          throw new Error('No data returned from login mutation');
        }
        const { userId } = data.loginWithEmailPassword.session;
        userSessionClient.signIn(userId);

        navigate({ to: return_to ?? '/', replace: true }).catch(logError);
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, [
          'invalid-email',
          'invalid-password',
        ] as const);
        switch (errorCode) {
          case 'invalid-email': {
            setFormError(
              'email',
              { message: 'Email not found' },
              { shouldFocus: true },
            );
            break;
          }
          case 'invalid-password': {
            resetField('password');
            setFormError(
              'password',
              { message: 'Password is incorrect' },
              { shouldFocus: true },
            );
            break;
          }
          default: {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not log you in.'),
            );
          }
        }
      });
  };

  return (
    <Card>
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
            <Button type="submit" className="w-full" disabled={loading}>
              Login
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/auth/register" className="underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
