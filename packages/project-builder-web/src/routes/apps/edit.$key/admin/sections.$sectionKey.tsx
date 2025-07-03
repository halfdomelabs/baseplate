import type React from 'react';

import {
  adminSectionEntityType,
  createAdminSectionSchema,
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
  InputFieldController,
  SelectFieldController,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useEffect } from 'react';

import AdminCrudSectionForm from './-components/admin-crud-section-form.js';

const SECTION_OPTIONS = [{ label: 'Crud', value: 'crud' }];

export const Route = createFileRoute(
  '/apps/edit/$key/admin/sections/$sectionKey',
)({
  component: AdminAppEditSectionPage,
  loader: ({ context: { adminDefinition }, params: { sectionKey } }) => {
    const sectionId =
      sectionKey === 'new'
        ? undefined
        : adminSectionEntityType.idFromKey(sectionKey);
    const existingSection = sectionId
      ? adminDefinition.sections?.find((section) => section.id === sectionId)
      : undefined;
    if (sectionId && !existingSection) throw notFound();
    return { adminDefinition, sectionId, existingSection };
  },
});

function AdminAppEditSectionPage(): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { key } = Route.useParams();
  const {
    saveDefinitionWithFeedback,
    saveDefinitionWithFeedbackSync,
    isSavingDefinition,
    definition,
  } = useProjectDefinition();
  const navigate = useNavigate();
  const { adminDefinition, sectionId, existingSection } = Route.useLoaderData();

  const adminSectionSchema = useDefinitionSchema(createAdminSectionSchema);

  const formProps = useResettableForm({
    values: existingSection,
    defaultValues: { type: 'crud' },
    resolver: zodResolver(adminSectionSchema),
  });

  const { control, handleSubmit, watch, reset } = formProps;

  useEffect(() => {
    reset(existingSection ?? { type: 'crud' });
  }, [reset, existingSection]);

  const onSubmit = handleSubmit((data) => {
    const id = data.id || adminSectionEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (config) => {
        const adminApp = config.apps.find(
          (app) => app.id === adminDefinition.id,
        );
        if (adminApp?.type !== 'admin') {
          throw new Error('Cannot add a section to a non-admin app');
        }

        adminApp.sections = sortBy(
          [
            ...(adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            ),
            { ...data, id },
          ],
          [(section) => section.name],
        );
      },
      {
        onSuccess: () => {
          if (!sectionId) {
            navigate({
              to: `/apps/edit/$key/admin/sections/$sectionKey`,
              params: { key, sectionKey: adminSectionEntityType.keyFromId(id) },
            });
          }
        },
      },
    );
  });

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const type = watch('type');

  function handleDelete(): void {
    requestConfirm({
      title: 'Delete Section',
      content: `Are you sure you want to delete ${
        existingSection?.name ?? 'this section'
      }?`,
      onConfirm: () => {
        saveDefinitionWithFeedbackSync(
          (config) => {
            const adminApp = config.apps.find(
              (app) => app.id === adminDefinition.id,
            );
            if (adminApp?.type !== 'admin') {
              throw new Error('Cannot add a section to a non-admin app');
            }

            adminApp.sections = (adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            );
          },
          {
            successMessage: 'Successfully deleted section!',
            onSuccess: () => {
              navigate({ to: '..' });
            },
          },
        );
      },
    });
  }

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <div className="p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        {sectionId && (
          <Button
            variant="link"
            size="none"
            onClick={() => {
              handleDelete();
            }}
          >
            Delete Section
          </Button>
        )}
        <InputFieldController label="Name" control={control} name="name" />
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
          options={SECTION_OPTIONS}
        />
        {(() => {
          switch (type as string) {
            case 'crud': {
              return <AdminCrudSectionForm formProps={formProps} />;
            }
            default: {
              return <div>Unsupported type {type}</div>;
            }
          }
        })()}
        <Button type="submit" disabled={isSavingDefinition}>
          Save
        </Button>
      </form>
    </div>
  );
}
