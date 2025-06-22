import type { AdminAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  adminAppSchema,
  authConfigSpec,
  zPluginWrapper,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  InputFieldController,
  MultiComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useMemo } from 'react';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminGeneralForm({ className, appConfig }: Props): React.JSX.Element {
  const {
    definition,
    saveDefinitionWithFeedback,
    pluginContainer,
    isSavingDefinition,
  } = useProjectDefinition();
  const schemaWithPlugins = useMemo(
    () => zPluginWrapper(adminAppSchema, pluginContainer),
    [pluginContainer],
  );

  const formProps = useResettableForm({
    resolver: zodResolver(schemaWithPlugins),
    values: appConfig,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const roleOptions = pluginContainer
    .getPluginSpecOptional(authConfigSpec)
    ?.getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <InputFieldController label="Name" control={control} name="name" />
        <InputFieldController
          label="Package Location (optional) e.g. packages/web"
          control={control}
          name="packageLocation"
        />
        {roleOptions && (
          <MultiComboboxFieldController
            label="Allowed Roles?"
            control={control}
            options={roleOptions}
            name="allowedRoles"
          />
        )}
        <Button type="submit" disabled={isSavingDefinition}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default AdminGeneralForm;
