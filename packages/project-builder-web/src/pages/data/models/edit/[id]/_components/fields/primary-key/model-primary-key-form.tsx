import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Button,
  DialogClose,
  DialogFooter,
  MultiComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId } from 'react';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useEditedModelConfig } from '../../../../../_hooks/use-edited-model-config.js';

interface ModelPrimaryKeyFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
  onSubmitSuccess?: () => void;
}

const primaryKeychema = z.object({
  fields: z.array(z.string()).min(1, 'At least one primary key is required'),
});

type FormValues = z.infer<typeof primaryKeychema>;

export function ModelPrimaryKeyForm({
  className,
  control: modelControl,
  onSubmitSuccess,
}: ModelPrimaryKeyFormProps): React.JSX.Element {
  const fields = useEditedModelConfig((model) => model.model.fields);
  const {
    field: { value: modelValue = [], onChange: onModelChange },
  } = useController({
    name: 'model.primaryKeyFieldRefs',
    control: modelControl,
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(primaryKeychema),
    values: { fields: modelValue },
  });

  const onSubmit = handleSubmit((data) => {
    onModelChange(data.fields);
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
        placeholder="Select fields to use as primary keys"
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" form={formId}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
