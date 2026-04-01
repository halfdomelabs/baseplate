import type React from 'react';

import {
  adminSectionEntityType,
  createWebAdminSectionSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ComboboxFieldController,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormActionBar,
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { HiDotsVertical } from 'react-icons/hi';

import { logAndFormatError } from '#src/services/error-formatter.js';

import AdminCrudSectionForm from './-components/admin-crud-section-form.js';
import { ReactIconComboboxController } from './-components/react-icon-combobox.js';

export const Route = createFileRoute(
  '/packages/apps/$key/admin-sections/$section-key',
)({
  component: EditAdminSectionPage,
  beforeLoad: ({
    params: { 'section-key': sectionKey },
    context: { adminApp },
  }) => {
    if (!adminApp) return {};

    const section = adminApp.sections.find(
      (s) => adminSectionEntityType.idFromKey(sectionKey) === s.id,
    );

    if (!section) return {};

    return {
      getTitle: () => section.name,
      section,
    };
  },
  loader: ({ context: { section, app } }) => {
    if (!section || !app) throw notFound();
    return { section, app };
  },
});

function EditAdminSectionPage(): React.JSX.Element {
  const { app } = Route.useLoaderData();
  const { key, 'section-key': sectionKey } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { requestConfirm } = useConfirmDialog();
  const { definition, saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const adminSectionSchema = useDefinitionSchema(createWebAdminSectionSchema);

  // Resolve section from live definition to avoid stale route context after save
  const sectionId = adminSectionEntityType.idFromKey(sectionKey);
  const liveApp = definition.apps.find((a) => a.id === app.id);
  const section =
    liveApp?.type === 'web'
      ? liveApp.adminApp.sections.find((s) => s.id === sectionId)
      : undefined;

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const formProps = useResettableForm({
    resolver: zodResolver(adminSectionSchema),
    values: section,
  });

  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) => {
    if (!section) return;
    const { id: _, ...sectionData } = data;
    return saveDefinitionWithFeedback((draftConfig) => {
      const webApp = draftConfig.apps.find((a) => a.id === app.id);
      if (webApp?.type !== 'web') return;

      const existingIndex = webApp.adminApp.sections.findIndex(
        (s) => s.id === adminSectionEntityType.idFromKey(sectionKey),
      );

      if (existingIndex !== -1) {
        webApp.adminApp.sections[existingIndex] = {
          ...sectionData,
          id: section.id,
        };
      }
    });
  });

  const handleDelete = (): void => {
    if (!section) return;
    void saveDefinitionWithFeedback(
      (draftConfig) => {
        const webApp = draftConfig.apps.find((a) => a.id === app.id);
        if (webApp?.type !== 'web') return;

        webApp.adminApp.sections = webApp.adminApp.sections.filter(
          (s) => s.id !== section.id,
        );
      },
      {
        successMessage: `Successfully deleted section "${section.name}"!`,
        onSuccess: () => {
          navigate({
            to: '/packages/apps/$key',
            params: { key },
          }).catch(logAndFormatError);
        },
      },
    );
  };

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  if (!section) {
    return <div />;
  }

  return (
    <div key={section.id}>
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2>{section.name}</h2>
          <p className="text-sm text-muted-foreground">{app.name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
            <HiDotsVertical aria-label="More Actions" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                disabled={isSavingDefinition}
                onClick={() => {
                  requestConfirm({
                    title: 'Delete Section',
                    content: `Are you sure you want to delete "${section.name}"? This action will permanently remove the admin section from your application.`,
                    buttonConfirmText: 'Delete',
                    buttonConfirmVariant: 'destructive',
                    onConfirm: handleDelete,
                  });
                }}
              >
                Delete Section
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-7xl space-y-4 p-4">
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>General</SectionListSectionTitle>
              <SectionListSectionDescription>
                Basic configuration for your admin section.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="space-y-6">
              <InputFieldController
                label="Name"
                control={control}
                name="name"
                autoComplete="off"
              />
              <ComboboxFieldController
                label="Feature"
                control={control}
                options={featureOptions}
                name="featureRef"
              />
              <ReactIconComboboxController
                label="Icon"
                control={control}
                name="icon"
                description="Choose an icon to represent this section"
              />
            </SectionListSectionContent>
          </SectionListSection>

          <AdminCrudSectionForm formProps={formProps} />
        </SectionList>
        <FormActionBar form={formProps} />
      </form>
    </div>
  );
}
