import { projectDefinitionSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { InputField, SectionList, toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { z } from 'zod';

import FormActionBar from '@src/components/FormActionBar';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';

const validationSchema = projectDefinitionSchema.pick({
  name: true,
  version: true,
  portOffset: true,
  packageScope: true,
});

type FormData = z.infer<typeof validationSchema>;

function ProjectSettingsPage(): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const form = useResettableForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: _.pick(definition, [
      'name',
      'version',
      'portOffset',
      'packageScope',
    ]),
  });

  const { handleSubmit, control, formState, reset } = form;

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

  useBlockUnsavedChangesNavigate(formState, {
    reset,
    onSubmit: handleSubmit(onSubmit),
  });

  return (
    <form
      className="relative h-full max-h-full pb-[var(--action-bar-height)]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 border-b bg-background py-6">
          <h1>Project settings</h1>
        </div>
        <SectionList>
          <SectionList.Section>
            <SectionList.SectionHeader>
              <SectionList.SectionTitle>Settings</SectionList.SectionTitle>
            </SectionList.SectionHeader>
            <SectionList.SectionContent className="flex max-w-80 flex-col gap-4">
              <InputField.Controller
                name="name"
                label="Project Name"
                description="Lowercase letters and dashes, e.g. my-project"
                control={control}
                placeholder="e.g. my-project"
              />
              <InputField.Controller
                name="portOffset"
                label="Port Offset"
                description="Multiple of 1000, e.g. 4000. This will offset the ports used by the project, e.g. API at 4001, database at 4432, to avoid conflicts with other projects."
                control={control}
                registerOptions={{ valueAsNumber: true }}
              />
              <InputField.Controller
                label="Default Version"
                name="version"
                description="Default package version for new apps"
                control={control}
              />
              <InputField.Controller
                label="Package Scope"
                name="packageScope"
                description="The scope for packages in this project, e.g. my-project will result in @my-project/app-name"
                control={control}
                registerOptions={{
                  setValueAs: (value: string) => value || undefined,
                }}
              />
            </SectionList.SectionContent>
          </SectionList.Section>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}

export default ProjectSettingsPage;
