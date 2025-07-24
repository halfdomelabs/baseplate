import type { WebAdminSectionConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  adminSectionEntityType,
  authConfigSpec,
  createWebAdminSectionSchema,
  createWebAppSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  ComboboxFieldController,
  FormActionBar,
  InputFieldController,
  MultiComboboxFieldController,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SelectFieldController,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SwitchFieldController,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useState } from 'react';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

import AdminCrudSectionForm from './-components/admin-crud-section-form.js';

export const Route = createFileRoute('/apps/edit/$key/web/admin/')({
  component: WebAdminPage,
});

function WebAdminPage(): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { webDefinition } = Route.useRouteContext();
  const { definition, saveDefinitionWithFeedback, pluginContainer } =
    useProjectDefinition();
  const webAppSchema = useDefinitionSchema(createWebAppSchema);
  const adminSectionSchema = useDefinitionSchema(createWebAdminSectionSchema);

  const [sectionToEdit, setSectionToEdit] = useState<
    WebAdminSectionConfig | undefined
  >();
  const [isEditingSection, setIsEditingSection] = useState(false);

  const formProps = useResettableForm({
    resolver: zodResolver(webAppSchema),
    values: webDefinition,
  });
  const { control, handleSubmit, reset, watch } = formProps;

  const sectionFormProps = useResettableForm({
    resolver: zodResolver(adminSectionSchema),
    values: sectionToEdit,
    defaultValues: { type: 'crud' },
  });

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === webDefinition.id ? data : app,
      );
    }),
  );

  const onSectionSubmit = sectionFormProps.handleSubmit((data) => {
    const id = data.id || adminSectionEntityType.generateNewId();
    saveDefinitionWithFeedback((draftConfig) => {
      const webApp = draftConfig.apps.find(
        (app) => app.id === webDefinition.id,
      );
      if (webApp?.type !== 'web') return;

      webApp.adminApp ??= {
        enabled: true,
        pathPrefix: '/admin',
        sections: [],
      };

      const existingIndex = webApp.adminApp.sections?.findIndex(
        (section) => section.id === data.id,
      );

      if (
        existingIndex !== undefined &&
        existingIndex >= 0 &&
        webApp.adminApp.sections
      ) {
        webApp.adminApp.sections[existingIndex] = { ...data, id };
      } else {
        webApp.adminApp.sections = sortBy(
          [...(webApp.adminApp.sections ?? []), { ...data, id }],
          [(section) => section.name],
        );
      }
    })
      .then(() => {
        setIsEditingSection(false);
        setSectionToEdit(undefined);
      })
      .catch(() => {
        // Error handling is done by saveDefinitionWithFeedback
      });
  });

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const roleOptions = pluginContainer
    .getPluginSpecOptional(authConfigSpec)
    ?.getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const adminEnabled = watch('adminApp.enabled');
  const sections = watch('adminApp.sections') ?? [];

  function handleDeleteSection(sectionId: string): void {
    const section = sections.find((s) => s.id === sectionId);
    requestConfirm({
      title: 'Delete Admin Section',
      content: `Are you sure you want to delete the section "${section?.name ?? 'Unknown'}"?`,
      onConfirm: () => {
        void saveDefinitionWithFeedback((draftConfig) => {
          const webApp = draftConfig.apps.find(
            (app) => app.id === webDefinition.id,
          );
          if (webApp?.type !== 'web' || !webApp.adminApp) return;

          webApp.adminApp.sections = webApp.adminApp.sections?.filter(
            (s) => s.id !== sectionId,
          );
        });
      },
    });
  }

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <>
      <form className="w-full max-w-7xl space-y-4 p-4" onSubmit={onSubmit}>
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>
                Admin Configuration
              </SectionListSectionTitle>
              <SectionListSectionDescription>
                Configure administrative features for your web application.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="space-y-6">
              <SwitchFieldController
                label="Enable Admin Panel"
                description="Add administrative interface to your web application"
                control={control}
                name="adminApp.enabled"
              />

              {adminEnabled && (
                <>
                  <InputFieldController
                    label="Admin Path Prefix"
                    placeholder="/admin"
                    description="URL prefix for admin routes (e.g. /admin)"
                    control={control}
                    name="adminApp.pathPrefix"
                  />

                  {roleOptions && (
                    <MultiComboboxFieldController
                      label="Admin Access Roles"
                      description="Which roles can access the admin panel"
                      control={control}
                      options={roleOptions}
                      name="adminApp.allowedRoles"
                    />
                  )}
                </>
              )}
            </SectionListSectionContent>
          </SectionListSection>

          {adminEnabled && (
            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>
                  Admin Sections
                </SectionListSectionTitle>
                <SectionListSectionDescription>
                  Configure CRUD interfaces for your data models.
                </SectionListSectionDescription>
              </SectionListSectionHeader>
              <SectionListSectionContent className="space-y-4">
                {sections.map((section) => (
                  <RecordView key={section.id}>
                    <RecordViewItemList>
                      <RecordViewItem title="Name">
                        <div className="flex items-center gap-2">
                          <span>{section.name}</span>
                        </div>
                      </RecordViewItem>
                      <RecordViewItem title="Type">
                        <Badge variant="secondary">{section.type}</Badge>
                      </RecordViewItem>
                      <RecordViewItem title="Icon">
                        {section.icon ?? (
                          <span className="text-muted-foreground">No icon</span>
                        )}
                      </RecordViewItem>
                    </RecordViewItemList>
                    <RecordViewActions>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        aria-label="Edit section"
                        onClick={() => {
                          setSectionToEdit(section as WebAdminSectionConfig);
                          sectionFormProps.reset(
                            section as WebAdminSectionConfig,
                          );
                          setIsEditingSection(true);
                        }}
                      >
                        <MdEdit />
                      </Button>
                      <Button
                        variant="ghostDestructive"
                        size="icon"
                        title="Delete"
                        aria-label="Delete section"
                        onClick={() => {
                          handleDeleteSection(section.id ?? '');
                        }}
                      >
                        <MdDeleteOutline />
                      </Button>
                    </RecordViewActions>
                  </RecordView>
                ))}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const defaultFeature = featureOptions[0]?.value ?? '';
                    const defaultSection: WebAdminSectionConfig = {
                      id: adminSectionEntityType.generateNewId(),
                      name: '',
                      type: 'crud',
                      featureRef: defaultFeature,
                      icon: '',
                      modelRef: '',
                      form: { fields: [] },
                      table: { columns: [] },
                    };
                    setSectionToEdit(defaultSection);
                    sectionFormProps.reset(defaultSection);
                    setIsEditingSection(true);
                  }}
                >
                  <MdAdd />
                  Add Section
                </Button>
              </SectionListSectionContent>
            </SectionListSection>
          )}
        </SectionList>
        <FormActionBar form={formProps} />
      </form>

      <Sheet open={isEditingSection} onOpenChange={setIsEditingSection}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {sectionToEdit?.id &&
              sections.some((s) => s.id === sectionToEdit.id)
                ? 'Edit Admin Section'
                : 'Add Admin Section'}
            </SheetTitle>
            <SheetDescription>
              Configure a CRUD interface for managing your data.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onSectionSubmit} className="mt-6">
            <div className="flex flex-col gap-4 px-4">
              <InputFieldController
                label="Name"
                control={sectionFormProps.control}
                name="name"
              />
              <ComboboxFieldController
                label="Feature"
                control={sectionFormProps.control}
                options={featureOptions}
                name="featureRef"
              />
              <InputFieldController
                label="Icon"
                control={sectionFormProps.control}
                name="icon"
              />
              <SelectFieldController
                label="Type"
                control={sectionFormProps.control}
                name="type"
                options={[{ label: 'Crud', value: 'crud' }]}
              />
              <AdminCrudSectionForm formProps={sectionFormProps} />
            </div>
            <SheetFooter>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Save Section</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingSection(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
