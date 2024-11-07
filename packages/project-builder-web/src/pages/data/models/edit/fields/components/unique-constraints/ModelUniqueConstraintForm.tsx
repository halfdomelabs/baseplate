import {
  ModelConfig,
  modelUniqueConstraintEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Dialog,
  MultiComboboxField,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId } from 'react';
import { Control, useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useEditedModelConfig } from '@src/pages/data/models/hooks/useEditedModelConfig';

interface ModelUniqueConstraintFormProps {
  className?: string;
  control: Control<ModelConfig>;
  onSubmitSuccess?: () => void;
  constraintId?: string;
}

const formSchema = z.object({
  id: z.string().optional(),
  fields: z.array(z.string()).min(1, 'At least one field is required'),
});

type FormValues = z.infer<typeof formSchema>;

export function ModelUniqueConstraintForm({
  className,
  control: modelControl,
  onSubmitSuccess,
  constraintId,
}: ModelUniqueConstraintFormProps): JSX.Element {
  const fields = useEditedModelConfig((model) => model.model.fields);
  const {
    field: { value: modelValue = [], onChange: onModelChange },
  } = useController({
    name: `model.uniqueConstraints`,
    control: modelControl,
  });

  const modelUniqueConstraint =
    constraintId === undefined
      ? undefined
      : modelValue.find((uc) => uc.id === constraintId);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: modelUniqueConstraint
      ? {
          id: modelUniqueConstraint.id,
          fields: modelUniqueConstraint.fields.map((f) => f.fieldRef),
        }
      : { fields: [] },
  });

  const onDelete = (): void => {
    onModelChange(modelValue.filter((uc) => uc.id !== constraintId));
    onSubmitSuccess?.();
  };

  const onSubmit = handleSubmit((data) => {
    const dataWithId = {
      id: data.id ?? modelUniqueConstraintEntityType.generateNewId(),
      fields: data.fields.map((fieldRef) => ({
        fieldRef,
      })),
    };
    const { id } = dataWithId;
    // replace the existing unique constraint with the new one if it exists
    if (modelValue.some((uc) => uc.id === id)) {
      onModelChange(modelValue.map((uc) => (uc.id === id ? dataWithId : uc)));
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
      <MultiComboboxField.Controller
        control={control}
        name="fields"
        options={fields.map((f) => ({ value: f.id, label: f.name }))}
        placeholder="Select fields to use as primary keys"
      />
      <Dialog.Footer>
        <div className="flex w-full justify-between">
          {constraintId && (
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
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit" form={formId}>
              Save
            </Button>
          </div>
        </div>
      </Dialog.Footer>
    </form>
  );
}
