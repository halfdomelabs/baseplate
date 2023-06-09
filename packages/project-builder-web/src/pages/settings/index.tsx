import { projectConfigSchema } from '@halfdomelabs/project-builder-lib';
import { Button, Card, TextInput } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { z } from 'zod';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';

const validationSchema = projectConfigSchema.pick({
  name: true,
  version: true,
  portOffset: true,
  packageScope: true,
});

type FormData = z.infer<typeof validationSchema>;

function SettingsPage(): JSX.Element {
  const { config, setConfigAndFixReferences } = useProjectConfig();
  const { handleSubmit, control } = useResettableForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: _.pick(config, [
      'name',
      'version',
      'portOffset',
      'packageScope',
    ]),
  });
  const toast = useToast();

  const onSubmit = (data: FormData): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        Object.assign(draftConfig, data);
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      logError(err);
      toast.error(formatError(err));
    }
  };

  return (
    <Card className="m-4 mx-auto max-w-lg self-start overflow-y-auto p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        <h1>Project Settings</h1>
        <TextInput.LabelledController
          name="name"
          label="Project Name"
          subtext="Lowercase letters and dashes, e.g. my-project"
          control={control}
          placeholder="e.g. my-project"
        />
        <TextInput.LabelledController
          name="portOffset"
          label="Port Offset"
          subtext="Multiple of 1000, e.g. 4000. This will offset the ports used by the project, e.g. API at 4001, database at 4432, to avoid conflicts with other projects."
          control={control}
          registerOptions={{ valueAsNumber: true }}
        />
        <TextInput.LabelledController
          label="Default Version"
          name="version"
          subtext="Default package version for new apps"
          control={control}
        />
        <TextInput.LabelledController
          label="Package Scope"
          name="packageScope"
          subtext="The scope for packages in this project, e.g. my-project will result in @my-project/app-name"
          control={control}
          registerOptions={{
            setValueAs: (value: string) => value || undefined,
          }}
        />
        <div>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );
}

export default SettingsPage;
