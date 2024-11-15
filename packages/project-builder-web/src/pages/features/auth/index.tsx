import type { AuthConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  AUTH_DEFAULT_ROLES,
  authSchema,
} from '@halfdomelabs/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Alert, Button } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useStatus } from 'src/hooks/useStatus';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';

import RoleEditorForm from './RoleEditorForm';

function AuthPage(): React.JSX.Element {
  const { definition, parsedProject, setConfig, setConfigAndFixReferences } =
    useProjectDefinition();

  const formProps = useResettableForm<AuthConfig>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      ...definition.auth,
      roles: definition.auth?.roles ?? AUTH_DEFAULT_ROLES,
    },
  });
  const { control, reset, handleSubmit } = formProps;
  const { status, setError } = useStatus();

  const onSubmit = (data: AuthConfig): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.auth = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (error) {
      logError(error);
      setError(formatError(error));
    }
  };

  const [isAuthEnabled, setIsAuthEnabled] = useState(!!definition.auth);

  const disableAuth = (): void => {
    setConfig((draftConfig) => {
      draftConfig.auth = undefined;
    });
    reset({});
    setIsAuthEnabled(false);
  };

  const modelOptions = parsedProject.getModels().map((m) => ({
    label: m.name,
    value: m.id,
  }));

  const featureOptions = definition.features.map((m) => ({
    label: m.name,
    value: m.id,
  }));

  return (
    <div className="space-y-4">
      <h2>Auth Configuration</h2>
      <Alert.WithStatus status={status} />
      {isAuthEnabled ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Button onClick={disableAuth}>Disable Auth</Button>
          <CheckedInput.LabelledController
            label="Use Auth0?"
            name="useAuth0"
            control={control}
          />
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
      ) : (
        <Button
          onClick={() => {
            setIsAuthEnabled(true);
          }}
        >
          Enable Auth
        </Button>
      )}
    </div>
  );
}

export default AuthPage;
