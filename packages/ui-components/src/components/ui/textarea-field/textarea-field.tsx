'use client';

import type { ComponentPropsWithRef } from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from 'react-hook-form';

import { useId } from 'react';
import { get, useFormState } from 'react-hook-form';

import type { FormFieldProps } from '#src/types/form.js';

import {
  Field,
  FieldDescription,
  FieldError as FieldErrorDisplay,
  FieldLabel,
} from '../field/field.js';
import { Textarea } from '../textarea/textarea.js';

export interface TextareaFieldProps
  extends
    Omit<ComponentPropsWithRef<'textarea'>, 'onChange' | 'value'>,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

function TextareaField({
  label,
  description,
  error,
  onChange,
  register,
  ...props
}: TextareaFieldProps): React.ReactElement {
  const id = useId();
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        onChange={
          onChange &&
          ((e) => {
            onChange(e.target.value);
          })
        }
        aria-invalid={!!error}
        {...props}
        {...register}
      />
      <FieldDescription>{description}</FieldDescription>
      <FieldErrorDisplay>{error}</FieldErrorDisplay>
    </Field>
  );
}

export interface TextareaFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends TextareaFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function TextareaFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  registerOptions,
  ...rest
}: TextareaFieldControllerProps<TFieldValues, TFieldName>): React.ReactElement {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextareaField
      register={control.register(name, registerOptions)}
      error={error?.message}
      {...rest}
    />
  );
}

export { TextareaField, TextareaFieldController };
