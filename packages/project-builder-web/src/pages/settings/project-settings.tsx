import type React from 'react';

import { projectDefinitionSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { pick } from 'es-toolkit';
import { useMemo } from 'react';

import { FormActionBar } from '@src/components';

const validationSchema = projectDefinitionSchema.pick({
  name: true,
  version: true,
  portOffset: true,
  packageScope: true,
});

function ProjectSettingsPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const defaultValues = useMemo(
    () => pick(definition, ['name', 'version', 'portOffset', 'packageScope']),
    [definition],
  );
  const form = useResettableForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      Object.assign(draftConfig, data);
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <form
      className="relative h-full max-h-full pb-(--action-bar-height)"
      onSubmit={onSubmit}
    >
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 border-b bg-background py-6">
          <h1>Project settings</h1>
        </div>
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Settings</SectionListSectionTitle>
            </SectionListSectionHeader>
            <SectionListSectionContent className="flex max-w-80 flex-col gap-4">
              <InputFieldController
                name="name"
                label="Project Name"
                description="Lowercase letters and dashes, e.g. my-project"
                control={control}
                placeholder="e.g. my-project"
              />
              <InputFieldController
                name="portOffset"
                label="Port Offset"
                description="Multiple of 1000, e.g. 4000. This will offset the ports used by the project, e.g. API at 4001, database at 4432, to avoid conflicts with other projects."
                control={control}
                registerOptions={{ valueAsNumber: true }}
              />
              <InputFieldController
                label="Default Version"
                name="version"
                description="Default package version for new apps"
                control={control}
              />
              <InputFieldController
                label="Package Scope"
                name="packageScope"
                description="The scope for packages in this project, e.g. my-project will result in @my-project/app-name"
                control={control}
                registerOptions={{
                  setValueAs: (value: string) => value || undefined,
                }}
              />
            </SectionListSectionContent>
          </SectionListSection>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}

export default ProjectSettingsPage;
