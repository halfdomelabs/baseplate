import type {
  BaseLibraryDefinition,
  LibraryEditComponentProps,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Resolver } from 'react-hook-form';

import { createLibraryWebConfig } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
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

import {
  TRANSACTIONAL_LIB_TYPE,
  transactionalLibDefinitionSchemaEntry,
} from '../schema/transactional-lib-definition.js';

import '#src/styles.css';

function TransactionalLibEditComponent({
  packageDefinition,
}: LibraryEditComponentProps): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();

  const transactionalLibSchema = useDefinitionSchema(
    transactionalLibDefinitionSchemaEntry.definitionSchema,
  );
  const formProps = useResettableForm<BaseLibraryDefinition>({
    resolver: zodResolver(
      transactionalLibSchema,
    ) as Resolver<BaseLibraryDefinition>,
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
    <form
      className="email:w-full email:max-w-7xl email:space-y-4 email:px-4"
      onSubmit={onSubmit}
    >
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>General</SectionListSectionTitle>
            <SectionListSectionDescription>
              Basic configuration for your transactional email library.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="email:space-y-6">
            <InputFieldController label="Name" control={control} name="name" />
          </SectionListSectionContent>
        </SectionListSection>

        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Customization</SectionListSectionTitle>
            <SectionListSectionDescription>
              How to customize your transactional email library.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent>
            <Alert>
              <AlertTitle>Customize Your Email Theme</AlertTitle>
              <AlertDescription>
                <p className="email:mb-2">
                  After syncing, customize the constants in your transactional
                  library:
                </p>
                <ul className="email:list-inside email:list-disc email:space-y-1 email:text-sm">
                  <li>
                    <code className="email:rounded email:bg-muted email:px-1">
                      src/constants/theme.ts
                    </code>{' '}
                    - Colors, typography, and spacing tokens
                  </li>
                  <li>
                    <code className="email:rounded email:bg-muted email:px-1">
                      src/components/layout.tsx
                    </code>{' '}
                    - Email header, footer, and branding
                  </li>
                </ul>
                <p className="email:mt-2 email:text-sm email:text-muted-foreground">
                  These files are generated once and won&apos;t be overwritten
                  during future syncs.
                </p>
              </AlertDescription>
            </Alert>
          </SectionListSectionContent>
        </SectionListSection>
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}

export const transactionalLibWebConfig = createLibraryWebConfig({
  name: transactionalLibDefinitionSchemaEntry.name,
  displayName: 'Transactional Email Library',
  EditComponent: TransactionalLibEditComponent,
  createDefinition: ({ id, name }) => ({
    id,
    name,
    type: TRANSACTIONAL_LIB_TYPE,
  }),
});
