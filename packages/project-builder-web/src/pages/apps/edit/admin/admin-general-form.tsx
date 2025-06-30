import type { AdminAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  authConfigSpec,
  createAdminAppSchema,
  zPluginWrapper,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  MultiComboboxFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useMemo } from 'react';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminGeneralForm({ className, appConfig }: Props): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback, pluginContainer } =
    useProjectDefinition();
  const adminAppSchema = useDefinitionSchema(createAdminAppSchema);
  const schemaWithPlugins = useMemo(
    () => zPluginWrapper(adminAppSchema, pluginContainer),
    [pluginContainer, adminAppSchema],
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
    <form
      className={clsx('w-full max-w-7xl space-y-4 p-4', className)}
      onSubmit={onSubmit}
    >
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>General</SectionListSectionTitle>
            <SectionListSectionDescription>
              Basic configuration for your admin application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <InputFieldController label="Name" control={control} name="name" />
            <InputFieldController
              label="Package Location (optional)"
              placeholder="e.g. packages/admin"
              control={control}
              name="packageLocation"
            />
          </SectionListSectionContent>
        </SectionListSection>

        {roleOptions && (
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Access Control</SectionListSectionTitle>
              <SectionListSectionDescription>
                Configure which user roles can access the admin application.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent>
              <MultiComboboxFieldController
                label="Allowed Roles"
                control={control}
                options={roleOptions}
                name="allowedRoles"
              />
            </SectionListSectionContent>
          </SectionListSection>
        )}
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}

export default AdminGeneralForm;
