import type React from 'react';

import { createNodeLibraryPackageSchema } from '@baseplate-dev/project-builder-lib';
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
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { UnlinkSection } from '../-components/unlink-section.js';

export const Route = createFileRoute('/apps/packages/$key/node-library')({
  component: NodeLibraryEditPage,
  loader: ({ context: { pkg }, params: { key } }) => {
    if (!pkg) throw notFound();
    // Cast to string to support future package types without lint errors
    const pkgType = pkg.type as string;
    if (pkgType !== 'node-library') {
      throw redirect({ to: '/apps/packages/$key', params: { key } });
    }
    return {
      packageDefinition: pkg,
    };
  },
});

function NodeLibraryEditPage(): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();
  const { packageDefinition } = Route.useLoaderData();

  const nodeLibrarySchema = useDefinitionSchema(createNodeLibraryPackageSchema);
  const formProps = useResettableForm({
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
