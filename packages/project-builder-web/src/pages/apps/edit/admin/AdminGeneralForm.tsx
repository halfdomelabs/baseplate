import type { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  adminAppSchema,
  zPluginWrapper,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { Button } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useMemo } from 'react';
import { TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';

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

  const formProps = useResettableForm<AdminAppConfig>({
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

  const roleOptions = definition.auth?.roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <TextInput.LabelledController
          label="Package Location (optional) e.g. packages/web"
          control={control}
          name="packageLocation"
        />
        {roleOptions && (
          <CheckedArrayInput.LabelledController
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
