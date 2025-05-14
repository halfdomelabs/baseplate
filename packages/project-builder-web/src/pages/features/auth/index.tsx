import type { AuthConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  applyModelPatchInPlace,
  AUTH_DEFAULT_ROLES,
  authRoleEntityType,
  authSchema,
  diffModel,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  CheckboxFieldController,
  ComboboxField,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';

import { createAuth0Models } from './auth-models';
import RoleEditorForm from './RoleEditorForm';

function AuthPage(): React.JSX.Element {
  const {
    definition,
    definitionContainer,
    saveDefinitionWithFeedback,
    saveDefinitionWithFeedbackSync,
  } = useProjectDefinition();

  const formProps = useResettableForm<AuthConfig>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      ...definition.auth,
      roles: definition.auth?.roles ?? AUTH_DEFAULT_ROLES,
    },
  });
  const { control, reset, handleSubmit } = formProps;

  const userModelRef = definition.auth?.userModelRef;
  const userRoleModelRef = definition.auth?.userRoleModelRef;

  const pendingModelChanges = useMemo(() => {
    if (!userModelRef || !userRoleModelRef) return;

    const desiredModels = createAuth0Models(userModelRef);

    const userModel = ModelUtils.byIdOrThrow(definition, userModelRef);
    const userRoleModel = ModelUtils.byIdOrThrow(definition, userRoleModelRef);
    return {
      user: diffModel(userModel.model, desiredModels.user, definitionContainer),
      userRole: diffModel(
        userRoleModel.model,
        desiredModels.userRole,
        definitionContainer,
      ),
    };
  }, [userModelRef, userRoleModelRef, definitionContainer, definition]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      if (pendingModelChanges?.user) {
        const model = ModelUtils.byIdOrThrow(draftConfig, data.userModelRef);
        applyModelPatchInPlace(
          model.model,
          pendingModelChanges.user,
          definitionContainer,
        );
      }
      if (pendingModelChanges?.userRole) {
        const model = ModelUtils.byIdOrThrow(
          draftConfig,
          data.userRoleModelRef,
        );
        applyModelPatchInPlace(
          model.model,
          pendingModelChanges.userRole,
          definitionContainer,
        );
      }
      draftConfig.auth = data;
    }),
  );

  const [isAuthEnabled, setIsAuthEnabled] = useState(!!definition.auth);

  const enableAuth = (): void => {
    formProps.reset({
      useAuth0: true,
      roles: AUTH_DEFAULT_ROLES.map((r) => ({
        ...r,
        id: authRoleEntityType.generateNewId(),
      })),
    });
    setIsAuthEnabled(true);
  };

  const disableAuth = (): void => {
    saveDefinitionWithFeedbackSync(
      (draftConfig) => {
        draftConfig.auth = undefined;
      },
      {
        onSuccess: () => {
          reset({});
          setIsAuthEnabled(false);
        },
      },
    );
  };

  const modelOptions = definition.models.map((m) => ({
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
      {isAuthEnabled ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <Button onClick={disableAuth}>Disable Auth</Button>

          {pendingModelChanges?.user && (
            <Alert>
              <AlertTitle>Model Changes</AlertTitle>
              <AlertDescription>
                <p>
                  The selected user model will be updated to include the
                  required fields for the auth plugin. The following changes
                  will be applied:
                </p>
                <ul>
                  {pendingModelChanges.user.fields.length > 0 && (
                    <li>
                      {pendingModelChanges.user.fields.length} field(s) will be
                      added or updated.
                    </li>
                  )}
                  {pendingModelChanges.user.relations.length > 0 && (
                    <li>
                      {pendingModelChanges.user.relations.length} relation(s)
                      will be added or updated.
                    </li>
                  )}
                  {pendingModelChanges.user.uniqueConstraints.length > 0 && (
                    <li>
                      {pendingModelChanges.user.uniqueConstraints.length} unique
                      constraint(s) will be added or updated.
                    </li>
                  )}
                  {pendingModelChanges.user.primaryKeyFieldRefs && (
                    <li>The primary key will be updated.</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {pendingModelChanges?.userRole && (
            <Alert>
              <AlertTitle>Model Changes</AlertTitle>
              <AlertDescription>
                <p>
                  The selected user role model will be updated to include the
                  required fields for the auth plugin. The following changes
                  will be applied:
                </p>
                <ul>
                  {pendingModelChanges.userRole.fields.length > 0 && (
                    <li>
                      {pendingModelChanges.userRole.fields.length} field(s) will
                      be added or updated.
                    </li>
                  )}
                  {pendingModelChanges.userRole.relations.length > 0 && (
                    <li>
                      {pendingModelChanges.userRole.relations.length}{' '}
                      relation(s) will be added or updated.
                    </li>
                  )}
                  {pendingModelChanges.userRole.uniqueConstraints.length >
                    0 && (
                    <li>
                      {pendingModelChanges.userRole.uniqueConstraints.length}
                      unique constraint(s) will be added or updated.
                    </li>
                  )}
                  {pendingModelChanges.userRole.primaryKeyFieldRefs && (
                    <li>The primary key will be updated.</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <CheckboxFieldController
            label="Use Auth0? (currently only Auth0 is supported)"
            name="useAuth0"
            control={control}
            disabled={true}
          />
          <ComboboxField.Controller
            label="User Model"
            options={modelOptions}
            name="userModelRef"
            control={control}
          />
          <ComboboxField.Controller
            label="User Role Model"
            options={modelOptions}
            name="userRoleModelRef"
            control={control}
          />
          <ComboboxField.Controller
            label="Auth Feature Path"
            options={featureOptions}
            name="authFeatureRef"
            control={control}
          />
          <ComboboxField.Controller
            label="Accounts Feature Path"
            options={featureOptions}
            name="accountsFeatureRef"
            control={control}
          />
          <CheckboxFieldController
            label="Enable Password Auth?"
            name="passwordProvider"
            control={control}
          />
          <RoleEditorForm control={control} />
          <Button type="submit">Save</Button>
        </form>
      ) : (
        <Button onClick={enableAuth}>Enable Auth</Button>
      )}
    </div>
  );
}

export default AuthPage;
