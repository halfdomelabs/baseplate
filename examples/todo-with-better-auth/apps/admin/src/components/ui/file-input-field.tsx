import type { FormFieldProps } from '@prisma-crud/ui-shared';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  cn,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  useFieldIds,
} from '@prisma-crud/ui-shared';
import { useController } from 'react-hook-form';

import type { FileInputProps, FileUploadInput } from './file-input';

import { FileInput } from './file-input';

interface FileInputFieldProps
  extends Omit<FileInputProps, 'onChange' | 'value'>, FormFieldProps {
  onChange?: (value: FileUploadInput | null) => void;
  value?: FileUploadInput;
}

export function FileInputField({
  label,
  description,
  error,
  className,
  'aria-describedby': ariaDescribedBy,
  ...props
}: FileInputFieldProps): React.ReactElement {
  // FileInput renders its `<input>` only while no file is selected, so the label
  // is associated by `aria-labelledby` rather than a `htmlFor` that would dangle.
  const { labelId, describedBy, descriptionProps, errorProps } = useFieldIds({
    'aria-describedby': ariaDescribedBy,
    description,
    error,
  });
  return (
    <Field
      data-invalid={!!error || undefined}
      className={cn('flex flex-col', className)}
    >
      {(!!label || !!description) && (
        <FieldContent>
          {label && <FieldLabel id={labelId}>{label}</FieldLabel>}
          {description && (
            <FieldDescription {...descriptionProps}>
              {description}
            </FieldDescription>
          )}
        </FieldContent>
      )}
      <FileInput
        {...props}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={describedBy}
      />
      <FieldError {...errorProps}>{error}</FieldError>
    </Field>
  );
}

interface FileInputFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FileInputFieldProps, 'onChange' | 'value' | 'error'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

export function FileInputFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: FileInputFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.ReactElement {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });
  const validatedValue =
    typeof value === 'object' && value?.id
      ? (value as unknown as FileUploadInput)
      : undefined;

  return (
    <FileInputField
      onChange={(newValue) => {
        onChange(newValue);
      }}
      value={validatedValue}
      error={error?.message}
      {...rest}
    />
  );
}
