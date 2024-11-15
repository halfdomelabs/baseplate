import type { WebAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { webAppSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';

interface Props {
  className?: string;
  appConfig: WebAppConfig;
}

function WebAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { setConfigAndFixReferences } = useProjectDefinition();

  const formProps = useResettableForm<WebAppConfig>({
    resolver: zodResolver(webAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit, formState, reset } = formProps;

  const { parsedProject } = useProjectDefinition();

  const onSubmit = handleSubmit((data) => {
    setConfigAndFixReferences((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    });
    toast.success('Successfully saved app!');
    reset(data);
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
        <TextInput.LabelledController
          label="Page Title"
          control={control}
          name="title"
        />
        <TextInput.LabelledController
          label="Description Meta Tag"
          control={control}
          name="description"
        />
        <CheckedInput.LabelledController
          label="Include Auth?"
          control={control}
          name="includeAuth"
        />
        <CheckedInput.LabelledController
          label="Include Upload Components?"
          control={control}
          name="includeUploadComponents"
        />
        <CheckedInput.LabelledController
          label="Enable Subscriptions?"
          control={control}
          name="enableSubscriptions"
        />
        <CheckedInput.LabelledController
          label="Enable Datadog Logging?"
          control={control}
          name="enableDatadog"
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

export default WebAppForm;
