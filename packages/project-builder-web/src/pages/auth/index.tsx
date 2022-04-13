import {
  AuthConfig,
  authSchema,
  AUTH_DEFAULT_ROLES,
} from '@baseplate/project-builder-lib';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import RoleEditorForm from './RoleEditorForm';

function AuthPage(): JSX.Element {
  const { config, parsedProject, setConfig, setConfigAndFixReferences } =
    useProjectConfig();

  const formProps = useForm<AuthConfig>({
    resolver: yupResolver(authSchema),
    defaultValues: {
      ...config.auth,
      roles: config.auth?.roles || AUTH_DEFAULT_ROLES,
    },
  });
  const { control, reset, handleSubmit } = formProps;
  const toast = useToast();
  const { status, setError } = useStatus();

  const onSubmit = (data: AuthConfig): void => {
    try {
      setConfigAndFixReferences((oldConfig) => {
        oldConfig.auth = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    }
  };

  const [isAuthEnabled, setIsAuthEnabled] = useState(!!config.auth);

  const disableAuth = (): void => {
    setConfig((newConfig) => {
      newConfig.auth = undefined;
    });
    reset({});
    setIsAuthEnabled(false);
  };

  const modelOptions = parsedProject.getModels().map((m) => ({
    label: m.name,
    value: m.name,
  }));

  const featureOptions =
    config.features?.map((m) => ({
      label: m.name,
      value: m.name,
    })) || [];

  return (
    <div className="space-y-4">
      <h2>Auth Configuration</h2>
      <Alert.WithStatus status={status} />
      {!isAuthEnabled ? (
        <Button onClick={() => setIsAuthEnabled(true)}>Enable Auth</Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Button onClick={disableAuth}>Disable Auth</Button>
          <ReactSelectInput.LabelledController
            label="User Model"
            options={modelOptions}
            name="userModel"
            control={control}
          />
          <ReactSelectInput.LabelledController
            label="User Role Model"
            options={modelOptions}
            name="userRoleModel"
            control={control}
          />
          <ReactSelectInput.LabelledController
            label="Auth Feature Path"
            options={featureOptions}
            name="authFeaturePath"
            control={control}
          />
          <ReactSelectInput.LabelledController
            label="Accounts Feature Path"
            options={featureOptions}
            name="accountsFeaturePath"
            control={control}
          />
          <CheckedInput.LabelledController
            label="Enable Password Auth?"
            name="passwordProvider"
            control={control}
          />
          <RoleEditorForm control={control} />
          <Button type="submit">Save</Button>
        </form>
      )}
    </div>
  );
}

export default AuthPage;
