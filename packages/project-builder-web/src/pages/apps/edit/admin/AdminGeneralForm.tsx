import {
  AdminAppConfig,
  adminAppSchema,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';


import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminGeneralForm({ className, appConfig }: Props): JSX.Element {
  const { parsedProject, setConfigAndFixReferences } = useProjectDefinition();

  const formProps = useResettableForm<AdminAppConfig>({
    resolver: zodResolver(adminAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit, formState } = formProps;
  const toast = useToast();

  useBlockDirtyFormNavigate(formState);

  function onSubmit(data: AdminAppConfig): void {
    setConfigAndFixReferences((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    });
    toast.success('Successfully saved app!');
  }

  const roleOptions = parsedProject.projectDefinition.auth?.roles.map(
    (role) => ({
      label: role.name,
      value: role.id,
    }),
  );

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
