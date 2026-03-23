import type React from 'react';
import type { Control } from 'react-hook-form';

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
} from '@baseplate-dev/ui-components';
import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type {
  FileCategoryInput,
  StoragePluginDefinitionInput,
} from '../schema/plugin-definition.js';

import { createFileCategorySchema } from '../schema/plugin-definition.js';
import { FileCategoryFormFields } from './file-category-form-fields.js';
import { getSelectableRoleOptions } from './get-selectable-role-options.js';

interface FileCategoryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: FileCategoryInput;
  isNew?: boolean;
  onSave: (category: FileCategoryInput) => void;
  parentControl: Control<StoragePluginDefinitionInput>;
}

export function FileCategoryDialog({
  open,
  onOpenChange,
  category,
  isNew = false,
  onSave,
  parentControl,
}: FileCategoryDialogProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();

  const fileCategorySchema = useDefinitionSchema(createFileCategorySchema);
  const form = useForm<FileCategoryInput>({
    resolver: zodResolver(fileCategorySchema),
    values: category,
  });

  const { control, handleSubmit } = form;
  const lens = useLens({ control });

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange?.(false);
  });

  const formId = useId();

  const roleOptions = getSelectableRoleOptions(pluginContainer, definition);

  // Get available storage adapters from parent form
  const adapters = useWatch({ control: parentControl, name: 's3Adapters' });
  const adapterOptions = adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div className="storage:py-4">
            <FileCategoryFormFields
              lens={lens}
              roleOptions={roleOptions}
              adapterOptions={adapterOptions}
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
