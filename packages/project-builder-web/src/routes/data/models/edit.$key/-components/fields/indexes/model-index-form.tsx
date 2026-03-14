import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { modelIndexEntityType } from '@baseplate-dev/project-builder-lib';
import {
  Button,
  DialogClose,
  DialogFooter,
  MultiComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface ModelIndexFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
  onSubmitSuccess?: () => void;
  indexId?: string;
}

const formSchema = z.object({
  id: z.string().optional(),
  fields: z.array(z.string()).min(1, 'At least one field is required'),
});

type FormValues = z.infer<typeof formSchema>;

export function ModelIndexForm({
  className,
  control: modelControl,
  onSubmitSuccess,
  indexId,
}: ModelIndexFormProps): React.JSX.Element {
  const fields = useWatch({ control: modelControl, name: 'model.fields' });
  const {
    field: { value: modelValue = [], onChange: onModelChange },
  } = useController({
    name: `model.indexes`,
    control: modelControl,
  });

  const modelIndex =
    indexId === undefined
      ? undefined
      : modelValue.find((idx) => idx.id === indexId);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: modelIndex
      ? {
          id: modelIndex.id,
          fields: modelIndex.fields.map((f) => f.fieldRef),
        }
      : { fields: [] },
  });

  const onDelete = (): void => {
    onModelChange(modelValue.filter((idx) => idx.id !== indexId));
    onSubmitSuccess?.();
  };

  const onSubmit = handleSubmit((data) => {
    const dataWithId = {
      id: data.id ?? modelIndexEntityType.generateNewId(),
      fields: data.fields.map((fieldRef) => ({
        fieldRef,
      })),
    };
    const { id } = dataWithId;
    // replace the existing index with the new one if it exists
    if (modelValue.some((idx) => idx.id === id)) {
      onModelChange(
        modelValue.map((idx) => (idx.id === id ? dataWithId : idx)),
      );
    } else {
      onModelChange([...modelValue, dataWithId]);
    }
    onSubmitSuccess?.();
  });

  const formId = useId();

  return (
    <form
      className={clsx('space-y-4', className)}
      onSubmit={(e) => {
        e.stopPropagation();
        return onSubmit(e);
      }}
      id={formId}
    >
      <MultiComboboxFieldController
        control={control}
        name="fields"
        options={fields.map((f) => ({ value: f.id, label: f.name }))}
        placeholder="Select fields to index"
      />
      <DialogFooter>
        <div className="flex w-full justify-between">
          {indexId && (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-4">
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button type="submit" form={formId}>
              Save
            </Button>
          </div>
        </div>
      </DialogFooter>
    </form>
  );
}
