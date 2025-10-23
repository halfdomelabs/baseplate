import type React from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import { useController } from 'react-hook-form';

import type { FormFieldProps } from '@src/types/form';

import { cn } from '@src/utils/cn';

import type { FileInputProps, FileUploadInput } from './file-input';

import { FileInput } from './file-input';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from './form-item';

interface FileInputFieldProps
  extends Omit<FileInputProps, 'onChange' | 'value'>,
    FormFieldProps {
  onChange?: (value: FileUploadInput | null) => void;
  value?: FileUploadInput;
}

export function FileInputField({
  label,
  description,
  error,
  className,
  ...props
}: FileInputFieldProps): React.ReactElement {
  return (
    <FormItem error={error} className={cn('flex flex-col gap-1.5', className)}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <FileInput {...props} />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
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
  // TODO: Validate value is correct type
  const validatedValue = value?.id ? (value as FileUploadInput) : undefined;

  return (
    <FileInputField
      onChange={(newValue) => {
        onChange(newValue as FieldPathValue<TFieldValues, TFieldName>);
      }}
      value={validatedValue}
      error={error?.message}
      {...rest}
    />
  );
}
