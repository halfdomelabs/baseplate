import type {
  BasePackageConfig,
  LibraryEditComponentProps,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { nodeLibraryDefinitionSchemaEntry } from '@baseplate-dev/project-builder-lib';
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

import { UnlinkSection } from '../../-components/unlink-section.js';

export function NodeLibraryEditComponent({
  packageDefinition,
}: LibraryEditComponentProps): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();

  // Get schema from the pre-registered entry
  const nodeLibrarySchema = useDefinitionSchema(
    nodeLibraryDefinitionSchemaEntry.definitionSchema,
  );
  const formProps = useResettableForm<BasePackageConfig>({
    resolver: zodResolver(nodeLibrarySchema),
    values: packageDefinition,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.packages = draftConfig.packages.map((pkg) =>
        pkg.id === packageDefinition.id ? data : pkg,
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

        <UnlinkSection
          entityType="package"
          entityId={packageDefinition.id}
          name={packageDefinition.name}
        />
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}

export const nodeLibraryWebConfig = {
  name: nodeLibraryDefinitionSchemaEntry.name,
  EditComponent: NodeLibraryEditComponent,
};
