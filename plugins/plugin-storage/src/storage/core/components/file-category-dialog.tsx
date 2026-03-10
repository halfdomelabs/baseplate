import type React from 'react';
import type { Control } from 'react-hook-form';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
  MultiComboboxFieldController,
  SelectFieldController,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type {
  FileCategoryInput,
  StoragePluginDefinitionInput,
} from '../schema/plugin-definition.js';

import { createFileCategorySchema } from '../schema/plugin-definition.js';

interface FileCategoryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: FileCategoryInput;
  isNew?: boolean;
  onSave: (category: FileCategoryInput) => void;
  parentControl: Control<StoragePluginDefinitionInput>;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function FileCategoryDialog({
  open,
  onOpenChange,
  category,
  isNew = false,
  onSave,
  parentControl,
  asChild,
  children,
}: FileCategoryDialogProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();

  const fileCategorySchema = useDefinitionSchema(createFileCategorySchema);
  const form = useForm<FileCategoryInput>({
    resolver: zodResolver(fileCategorySchema),
    values: category,
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange?.(false);
  });

  const formId = useId();

  // Get available auth roles
  const roleOptions = pluginContainer
    .use(authConfigSpec)
    .getAuthConfigOrThrow(definition)
    .roles.map((role) => ({
      label: role.name,
      value: role.id,
    }));

  // Get available storage adapters from parent form
  const adapters = useWatch({ control: parentControl, name: 's3Adapters' });
  const adapterOptions = adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Add File Category' : 'Edit File Category'}
            </DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new file category.'
                : 'Update the file category details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="storage:space-y-4 storage:py-4">
            <InputFieldController
              label="Category Name"
              name="name"
              control={control}
              placeholder="e.g., USER_PROFILE_AVATAR"
              description="Must be CONSTANT_CASE format"
            />
            <InputFieldController
              label="Max File Size (MB)"
              name="maxFileSizeMb"
              control={control}
              type="number"
              placeholder="e.g., 10"
              description="Maximum file size in megabytes"
              registerOptions={{
                valueAsNumber: true,
              }}
            />
            <MultiComboboxFieldController
              label="Upload Roles"
              name="authorize.uploadRoles"
              control={control}
              options={roleOptions}
              placeholder="Select roles that can upload..."
              description="User roles authorized to upload files"
            />
            <SelectFieldController
              label="Storage Adapter"
              name="adapterRef"
              control={control}
              options={adapterOptions}
              placeholder="Select storage adapter..."
              description="Where files will be stored"
            />
            <SwitchFieldController
              label="Disable Auto-Cleanup"
              name="disableAutoCleanup"
              control={control}
              description="When enabled, files in this category will not be automatically cleaned up"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button form={formId} type="submit">
              {isNew ? 'Add' : 'Update'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
