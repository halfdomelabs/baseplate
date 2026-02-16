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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';

import { logAndFormatError } from '#src/services/error-formatter.js';

import AdminCrudSectionForm from './-components/admin-crud-section-form.js';
import { ReactIconComboboxController } from './-components/react-icon-combobox.js';

export const Route = createFileRoute(
  '/admin-sections/$appKey/edit/$sectionKey',
)({
  component: EditAdminSectionPage,
  beforeLoad: ({ params: { sectionKey }, context: { adminApp } }) => {
    if (!adminApp) return {};

    const section = adminApp.sections?.find(
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
  const { app, section } = Route.useLoaderData();
  const { appKey, sectionKey } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { definition, saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const adminSectionSchema = useDefinitionSchema(createWebAdminSectionSchema);

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
    const { id: _, ...sectionData } = data;
    return saveDefinitionWithFeedback((draftConfig) => {
      const webApp = draftConfig.apps.find((a) => a.id === app.id);
      if (webApp?.type !== 'web' || !webApp.adminApp) return;

      const existingIndex = webApp.adminApp.sections?.findIndex(
        (s) => s.id === adminSectionEntityType.idFromKey(sectionKey),
      );

      if (
        existingIndex !== undefined &&
        existingIndex >= 0 &&
        webApp.adminApp.sections
      ) {
        webApp.adminApp.sections[existingIndex] = {
          ...sectionData,
          id: section.id,
        };
      }
    });
  });

  const handleDelete = (): void => {
    void saveDefinitionWithFeedback(
      (draftConfig) => {
        const webApp = draftConfig.apps.find((a) => a.id === app.id);
        if (webApp?.type !== 'web' || !webApp.adminApp) return;

        webApp.adminApp.sections = webApp.adminApp.sections?.filter(
          (s) => s.id !== section.id,
        );
      },
      {
        successMessage: `Successfully deleted section "${section.name}"!`,
        onSuccess: () => {
          navigate({
            to: '/admin-sections/$appKey',
            params: { appKey },
          }).catch(logAndFormatError);
        },
      },
    );
  };

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={section.id}
    >
      <div className="max-w-7xl space-y-4 border-b p-4">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <h2>{section.name}</h2>
            <p className="text-base text-muted-foreground">
              {section.type} section
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {section.name}</DialogTitle>
                <DialogDescription className="sr-only">
                  Are you sure you want to delete{' '}
                  <strong>{section.name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <p>
                Are you sure you want to delete <strong>{section.name}</strong>?
              </p>
              <p className="text-style-muted">
                This action will permanently remove the admin section from your
                application. This cannot be undone.
              </p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSavingDefinition}
                >
                  Delete Section
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
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
    </div>
  );
}
