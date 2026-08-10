import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Button,
  DialogClose,
  DialogFooter,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId } from 'react';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

interface ModelFieldDescriptionFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
  idx: number;
  onSubmitSuccess?: () => void;
}

const descriptionSchema = z.object({ description: z.string() });

type FormValues = z.infer<typeof descriptionSchema>;

export function ModelFieldDescriptionForm({
  className,
  control: modelControl,
  idx,
  onSubmitSuccess,
}: ModelFieldDescriptionFormProps): React.JSX.Element {
  const {
    field: { value: modelValue, onChange: onModelChange },
  } = useController({
    name: `model.fields.${idx}.description`,
    control: modelControl,
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(descriptionSchema),
    values: { description: modelValue ?? '' },
  });

  const onSubmit = handleSubmit((data) => {
    onModelChange(data.description);
    onSubmitSuccess?.();
  });

  const onReset = (): void => {
    onModelChange('');
    onSubmitSuccess?.();
  };

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
      <InputFieldController control={control} name="description" />
      <DialogFooter>
        <div className="flex w-full justify-between">
          {modelValue && (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                onReset();
              }}
            >
              Reset
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
