// @ts-nocheck

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { Alert, Button, Card, TextInput } from '%react-components';
import { useLoginWithEmailAndPasswordMutation } from '%react-apollo/generated';
import { useStatus } from '%react-components/useStatus';
import { authService } from '%auth-service';
import { formatError } from '%react-error/formatter';
import { getApolloErrorCode } from '%apollo-error/utils';

const formSchema = yup.object({
  email: yup.string().email().lowercase().required(),
  password: yup.string().min(8).required(),
});

type FormData = yup.InferType<typeof formSchema>;

const REQUIRED_ROLES = ALLOWED_ROLES;

interface LoginLocationState {
  from?: Location;
}

function LoginPage(): JSX.Element {
  const {
    register,
    handleSubmit,
    resetField,
    setError: setFormError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
  });
  const { status, setError } = useStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { loading }] = useLoginWithEmailAndPasswordMutation({
    onCompleted: (data) => {
      const userRoles = data.loginWithEmailAndPassword.user.roles;
      if (!userRoles.some((role) => REQUIRED_ROLES.includes(role.role))) {
        setError('Sorry, you do not have permission to access this website.');
        return;
      }
      authService.setAuthPayload(data.loginWithEmailAndPassword.authPayload);
      const from = (location.state as LoginLocationState).from?.pathname || '/';
      navigate(from);
    },
  });

  const onSubmit = (data: FormData): void => {
    login({
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    }).catch((err) => {
      const errorCode = getApolloErrorCode(err, [
        'user-not-found',
        'user-has-no-password',
        'invalid-password',
      ] as const);
      switch (errorCode) {
        case 'user-not-found':
          setFormError(
            'email',
            { message: 'User does not exist' },
            { shouldFocus: true }
          );
          break;
        case 'invalid-password':
          resetField('password');
          setFormError(
            'password',
            { message: 'Password is incorrect' },
            { shouldFocus: true }
          );
          break;
        case 'user-has-no-password':
          setError(
            "You don't have a password assigned to your account. Maybe you logged in another way?"
          );
          break;
        default:
          setError(formatError(err, 'Sorry, we could not log you in.'));
      }
    });
  };

  return (
    <Card padding className="w-full">
      <div className="space-y-4">
        <h1>Login</h1>
        <Alert.WithStatus status={status} />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextInput.Labelled
            label="Email"
            register={register('email')}
            error={errors.email?.message}
          />
          <TextInput.Labelled
            label="Password"
            type="password"
            register={register('password')}
            error={errors.password?.message}
          />
          <Button disabled={loading} type="submit">
            Log In
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default LoginPage;
