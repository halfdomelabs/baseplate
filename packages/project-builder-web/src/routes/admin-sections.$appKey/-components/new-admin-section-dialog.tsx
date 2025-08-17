import type React from 'react';

import {
  adminSectionEntityType,
  createWebAdminSectionSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ComboboxFieldController,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
  SelectFieldController,
  useControlledState,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

interface NewAdminSectionDialogProps {
  children: React.ReactNode;
  appId: string;
  appKey: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function NewAdminSectionDialog({
  children,
  appId,
  appKey,
  open,
  onOpenChange,
}: NewAdminSectionDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const navigate = useNavigate();

  const { definition, saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const adminSectionSchema = useDefinitionSchema(createWebAdminSectionSchema);

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const modelOptions = definition.models.map((m) => ({
    label: m.name,
    value: m.id,
  }));

  const formProps = useResettableForm({
    resolver: zodResolver(adminSectionSchema),
    defaultValues: {
      name: '',
      type: 'crud' as const,
      featureRef: featureOptions[0]?.value ?? '',
      icon: '',
      modelRef: '',
      nameFieldRef: '',
      form: { fields: [] },
      table: { columns: [] },
    },
  });

  const { control, handleSubmit, reset } = formProps;

  const modelRef = useWatch({
    control,
    name: 'modelRef',
  });

  const fieldOptions = useMemo(
    () =>
      definition.models
        .find((m) => m.id === modelRef)
        ?.model.fields.map((f) => ({
          label: f.name,
          value: f.id,
        })) ?? [],
    [definition.models, modelRef],
  );

  const onSubmit = handleSubmit((data) => {
    const newId = adminSectionEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (draftConfig) => {
        const webApp = draftConfig.apps.find((a) => a.id === appId);
        if (webApp?.type !== 'web') return;

        webApp.adminApp ??= {
          enabled: true,
          pathPrefix: '/admin',
          sections: [],
        };

        webApp.adminApp.sections = [
          ...(webApp.adminApp.sections ?? []),
          { ...data, id: newId },
        ].sort((a, b) => a.name.localeCompare(b.name));
      },
      {
        successMessage: `Successfully created section "${data.name}"!`,
        onSuccess: () => {
          setIsOpen(false);
          reset();
          // Navigate to the newly created section
          navigate({
            to: '/admin-sections/$appKey/edit/$sectionKey',
            params: {
              appKey,
              sectionKey: adminSectionEntityType.keyFromId(newId),
            },
          });
        },
      },
    );
  });

  const handleOpenChange = (newOpen: boolean): void => {
    setIsOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Admin Section</DialogTitle>
          <DialogDescription>
            Create a new CRUD interface for managing your data models.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
          className="space-y-4"
        >
          <InputFieldController
            label="Name"
            control={control}
            name="name"
            placeholder="e.g. Users, Posts, Categories"
            description="The display name for this admin section"
            autoComplete="off"
          />
          <ComboboxFieldController
            label="Feature"
            control={control}
            options={featureOptions}
            name="featureRef"
            description="The feature this section belongs to"
          />
          <InputFieldController
            label="Icon"
            control={control}
            name="icon"
            placeholder="e.g. MdPeople, MdArticle"
            description="React icon component name (optional)"
          />
          <SelectFieldController
            label="Type"
            control={control}
            name="type"
            options={[{ label: 'CRUD', value: 'crud' }]}
            description="The type of admin interface"
          />
          <ComboboxFieldController
            label="Model"
            control={control}
            options={modelOptions}
            name="modelRef"
            description="The model to use for this section"
          />
          <ComboboxFieldController
            label="Name Field"
            control={control}
            options={fieldOptions}
            name="nameFieldRef"
            description="The field to use for the name of the section"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingDefinition}>
              {isSavingDefinition ? 'Creating...' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewAdminSectionDialog;
