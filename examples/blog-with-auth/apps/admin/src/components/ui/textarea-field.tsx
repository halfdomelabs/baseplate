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

import { get, useFormState } from 'react-hook-form';

import type { FormFieldProps } from '@src/types/form';

import { useFieldIds } from '@src/hooks/use-field-ids';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError as FieldErrorDisplay,
  FieldLabel,
} from './field';
import { Textarea } from './textarea';

/**
 * Field with label and error states that wraps a Textarea component.
 */
export interface TextareaFieldProps
  extends
    Omit<ComponentPropsWithRef<'textarea'>, 'onChange' | 'value'>,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
  size?: 'sm' | 'default' | 'xl';
}

function TextareaField({
  label,
  description,
  error,
  disabled,
  onChange,
  register,
  size = 'default',
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: TextareaFieldProps): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });
  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled ?? undefined}
    >
      {(!!label || !!description) && (
        <FieldContent>
          {label && <FieldLabel {...labelProps}>{label}</FieldLabel>}
          {description && (
            <FieldDescription {...descriptionProps}>
              {description}
            </FieldDescription>
          )}
        </FieldContent>
      )}
      <Textarea
        {...controlProps}
        size={size}
        disabled={disabled}
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
      <FieldErrorDisplay {...errorProps}>{error}</FieldErrorDisplay>
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
