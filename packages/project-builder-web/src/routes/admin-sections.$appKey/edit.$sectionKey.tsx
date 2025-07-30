import type React from 'react';

import {
  adminSectionEntityType,
  createWebAdminSectionSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ComboboxFieldController,
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

import AdminCrudSectionForm from './-components/admin-crud-section-form.js';

export const Route = createFileRoute(
  '/admin-sections/$appKey/edit/$sectionKey',
)({
  component: EditAdminSectionPage,
  beforeLoad: ({ params: { sectionKey }, context: { adminApp, app } }) => {
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

  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const adminSectionSchema = useDefinitionSchema(createWebAdminSectionSchema);

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const formProps = useResettableForm({
    resolver: zodResolver(adminSectionSchema),
    values: section,
    defaultValues: { type: 'crud' },
  });

  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) => {
    const { id: _dataId, ...sectionData } = data;
    return saveDefinitionWithFeedback((draftConfig) => {
      const webApp = draftConfig.apps.find((a) => a.id === app.id);
      if (webApp?.type !== 'web' || !webApp.adminApp) return;

      const existingIndex = webApp.adminApp.sections?.findIndex(
        (s) => s.id === sectionKey,
      );

      if (
        existingIndex !== undefined &&
        existingIndex >= 0 &&
        webApp.adminApp.sections
      ) {
        webApp.adminApp.sections[existingIndex] = {
          ...sectionData,
          id: sectionKey,
        };
      }
    }).then(() => {
      // Stay on the same page after successful save
      // The form will show the updated data
    });
  });

  const handleCancel = (): void => {
    navigate({
      to: '/admin-sections/$appKey',
      params: { appKey },
    });
  };

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{section.name}</h1>
            <p className="text-sm text-muted-foreground">
              Edit admin section for {app.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-4">
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
            <InputFieldController label="Icon" control={control} name="icon" />
            <SelectFieldController
              label="Type"
              control={control}
              name="type"
              options={[{ label: 'Crud', value: 'crud' }]}
            />
          </div>

          <AdminCrudSectionForm formProps={formProps} />

          <div className="flex gap-2 pt-4">
            <Button type="submit">Save Changes</Button>
            <Button variant="outline" type="button" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
