import {
  AdminAppConfig,
  adminAppSchema,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';

import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminGeneralForm({ className, appConfig }: Props): JSX.Element {
  const { parsedProject, setConfigAndFixReferences } = useProjectConfig();

  const formProps = useResettableForm<AdminAppConfig>({
    resolver: zodResolver(adminAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit } = formProps;
  const toast = useToast();

  function onSubmit(data: AdminAppConfig): void {
    setConfigAndFixReferences((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.uid === appConfig.uid ? data : app,
      );
    });
    toast.success('Successfully saved app!');
  }

  const roleOptions = parsedProject.projectConfig.auth?.roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  return (
    <div className={classNames('', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
