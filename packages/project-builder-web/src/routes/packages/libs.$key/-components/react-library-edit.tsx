import type {
  BaseLibraryDefinition,
  LibraryEditComponentProps,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createLibraryWebConfig,
  reactLibraryDefinitionSchemaEntry,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';

function ReactLibraryEditComponent({
  packageDefinition,
}: LibraryEditComponentProps): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();

  // Get schema from the pre-registered entry
  const reactLibrarySchema = useDefinitionSchema(
    reactLibraryDefinitionSchemaEntry.definitionSchema,
  );
  const formProps = useResettableForm<BaseLibraryDefinition>({
    resolver: zodResolver(reactLibrarySchema),
    values: packageDefinition,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.libraries = draftConfig.libraries.map((lib) =>
        lib.id === packageDefinition.id ? data : lib,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <form className="w-full max-w-7xl space-y-4 px-4" onSubmit={onSubmit}>
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>General</SectionListSectionTitle>
            <SectionListSectionDescription>
              Basic configuration for your library package.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <InputFieldController label="Name" control={control} name="name" />
          </SectionListSectionContent>
        </SectionListSection>
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}

export const reactLibraryWebConfig = createLibraryWebConfig({
  name: reactLibraryDefinitionSchemaEntry.name,
  displayName: 'React Library',
  description: 'Shared React components and hooks',
  EditComponent: ReactLibraryEditComponent,
  createDefinition: ({ id, name }) => ({
    id,
    name,
    type: 'react-library',
  }),
});
