// @ts-nocheck

import { EMAIL_OTP_LENGTH, EMAIL_OTP_RESEND_COOLDOWN_SEC } from '$otpConstants';
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
  InputOtpFieldController,
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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/auth_/login-otp')({
  validateSearch: z.object({
    return_to: z
      .string()
      .refine((v) => v.startsWith('/') && !v.startsWith('//'))
      .optional(),
  }),
  component: LoginOtpPage,
  beforeLoad: ({ search: { return_to }, context: { userId } }) => {
    if (userId) {
      throw redirect({ to: return_to ?? '/' });
    }
  },
});

const emailSchema = z.object({
  email: z
    .email('Please enter a valid email address')
    .transform((value) => value.toLowerCase()),
});

const codeSchema = z.object({
  code: z
    .string()
    .length(EMAIL_OTP_LENGTH, `Enter the ${EMAIL_OTP_LENGTH}-digit code`),
  name: z.string().max(100).optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

const requestEmailOtpMutation = graphql(`
  mutation RequestEmailOtp($input: RequestEmailOtpInput!) {
    requestEmailOtp(input: $input) {
      success
    }
  }
`);

const signInWithEmailOtpMutation = graphql(`
  mutation SignInWithEmailOtp($input: SignInWithEmailOtpInput!) {
    signInWithEmailOtp(input: $input) {
      session {
        userId
      }
    }
  }
`);

function LoginOtpPage(): React.JSX.Element {
  const [sentToEmail, setSentToEmail] = useState<string | undefined>();
  // Set once the server reports the code is valid but the address is new and
  // needs a name. Revealing the field any earlier would leak whether an
  // account exists.
  const [needsName, setNeedsName] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { return_to } = Route.useSearch();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [resendCooldown]);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    reValidateMode: 'onBlur',
  });
  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    reValidateMode: 'onBlur',
  });

  const [requestEmailOtp, { loading: isRequesting }] = useMutation(
    requestEmailOtpMutation,
  );
  const [signInWithEmailOtp, { loading: isVerifying }] = useMutation(
    signInWithEmailOtpMutation,
  );

  const onRequestCode = ({ email }: EmailFormData): void => {
    requestEmailOtp({ variables: { input: { email } } })
      .then(() => {
        setSentToEmail(email);
        setNeedsName(false);
        setResendCooldown(EMAIL_OTP_RESEND_COOLDOWN_SEC);
        codeForm.reset({ code: '', name: '' });
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, ['too-many-requests']);
        if (errorCode === 'too-many-requests') {
          emailForm.setError('email', {
            message: 'Too many sign-in code requests. Please try again later.',
          });
          return;
        }
        toast.error(
          logAndFormatError(err, 'Sorry, we could not send you a code.'),
        );
      });
  };

  const onVerifyCode = ({ code, name }: CodeFormData): void => {
    if (!sentToEmail) return;
    const trimmedName = name?.trim();
    // Send a blank name as absent so the server answers with `name-required`
    // rather than a validation error.
    const nameInput = trimmedName ? trimmedName : undefined;
    if (needsName && !nameInput) {
      codeForm.setError(
        'name',
        { message: 'Please enter your name' },
        { shouldFocus: true },
      );
      return;
    }
    signInWithEmailOtp({
      variables: { input: { email: sentToEmail, code, name: nameInput } },
    })
      .then(({ data }) => {
        if (!data) {
          throw new Error('No data returned from sign-in mutation');
        }
        const { userId } = data.signInWithEmailOtp.session;
        userSessionClient.signIn(userId);

        navigate({ to: return_to ?? '/', replace: true }).catch(logError);
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, [
          'invalid-code',
          'name-required',
          'too-many-requests',
          'verification-context-missing',
        ] as const);
        switch (errorCode) {
          case 'invalid-code': {
            codeForm.setError(
              'code',
              { message: 'That code is incorrect or has expired' },
              { shouldFocus: true },
            );
            break;
          }
          case 'verification-context-missing': {
            codeForm.setError('code', {
              message:
                'Codes can only be used in the browser that requested them. Request a new one to continue.',
            });
            break;
          }
          case 'name-required': {
            // The code is still valid — collect a name and submit it again.
            setNeedsName(true);
            codeForm.setError(
              'name',
              { message: 'Please enter your name' },
              { shouldFocus: true },
            );
            break;
          }
          case 'too-many-requests': {
            codeForm.setError('code', {
              message: 'Too many attempts. Please try again later.',
            });
            break;
          }
          case null: {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not sign you in.'),
            );
          }
        }
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {!sentToEmail && 'Sign in with a code'}
          {sentToEmail &&
            (needsName ? 'Finish creating your account' : 'Enter your code')}
        </CardTitle>
        <CardDescription>
          {!sentToEmail &&
            `We'll email you a code so you can sign in without a password.`}
          {sentToEmail &&
            (needsName
              ? 'Your code checked out — tell us your name to finish setting up your account.'
              : `We sent a ${EMAIL_OTP_LENGTH}-digit code to ${sentToEmail}.`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sentToEmail ? (
          <form onSubmit={codeForm.handleSubmit(onVerifyCode)}>
            <div className="flex flex-col items-center gap-4">
              <InputOtpFieldController
                control={codeForm.control}
                name="code"
                length={EMAIL_OTP_LENGTH}
              />
              {needsName && (
                <InputFieldController
                  control={codeForm.control}
                  name="name"
                  label="Your name"
                  autoComplete="name"
                  className="w-full"
                />
              )}
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {needsName ? 'Create account' : 'Sign in'}
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-4 text-center text-sm">
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline disabled:no-underline disabled:opacity-70"
                disabled={resendCooldown > 0 || isRequesting}
                onClick={() => {
                  onRequestCode({ email: sentToEmail });
                }}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </button>
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setSentToEmail(undefined);
                  setNeedsName(false);
                }}
              >
                Use a different email
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={emailForm.handleSubmit(onRequestCode)}>
            <div className="flex flex-col gap-4">
              <InputFieldController
                control={emailForm.control}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
              />
              <Button type="submit" className="w-full" disabled={isRequesting}>
                Email me a code
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-4 text-center text-sm">
              <Link
                to="/auth/login"
                search={{ return_to }}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Sign in with a password instead
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
