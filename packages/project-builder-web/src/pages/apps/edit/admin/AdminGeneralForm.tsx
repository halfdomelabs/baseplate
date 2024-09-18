import {
  AdminAppConfig,
  adminAppSchema,
  zPluginWrapper,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useMemo } from 'react';

import { logAndFormatError } from '@src/services/error-formatter';
import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminGeneralForm({ className, appConfig }: Props): JSX.Element {
  const { parsedProject, setConfigAndFixReferences, pluginContainer } =
    useProjectDefinition();
  const schemaWithPlugins = useMemo(
    () => zPluginWrapper(adminAppSchema, pluginContainer),
    [pluginContainer],
  );

  const formProps = useResettableForm<AdminAppConfig>({
    resolver: zodResolver(schemaWithPlugins),
    defaultValues: appConfig,
  });
  const { control, handleSubmit, formState, reset } = formProps;

  const onSubmit = handleSubmit((data) => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.apps = draftConfig.apps.map((app) =>
          app.id === appConfig.id ? data : app,
        );
      });
      toast.success('Successfully saved app!');
      reset(data);
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  });

  useBlockUnsavedChangesNavigate(formState, { reset, onSubmit });

  const roleOptions = parsedProject.projectDefinition.auth?.roles.map(
    (role) => ({
      label: role.name,
      value: role.id,
    }),
  );

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
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

export default AdminGeneralForm;
