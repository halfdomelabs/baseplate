import type React from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from 'react-hook-form';

import { get, useFormState } from 'react-hook-form';

import type { FormFieldProps } from '../../types/form.js';
import type { InputProps } from './input.js';

import { useFieldIds } from '../../hooks/use-field-ids.js';
import { cn } from '../../utils/cn.js';
import { mergeRefs } from '../../utils/merge-refs.js';
import {
  Field,
  FieldDescription,
  FieldError as FieldErrorDisplay,
  FieldLabel,
} from './field.js';
import { Input } from './input.js';

export interface InputFieldProps
  extends Omit<InputProps, 'onChange' | 'value'>, FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

function InputField({
  label,
  description,
  error,
  disabled,
  onChange,
  register,
  className,
  size,
  ref,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputFieldProps): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });
  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={cn('gap-1.5', className)}
    >
      <FieldLabel {...labelProps}>{label}</FieldLabel>
      <Input
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
        ref={mergeRefs(ref, register?.ref)}
        {...props}
        {...register}
      />
      <FieldDescription {...descriptionProps}>{description}</FieldDescription>
      <FieldErrorDisplay {...errorProps}>{error}</FieldErrorDisplay>
    </Field>
  );
}

export interface InputFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends InputFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function InputFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  registerOptions,
  ...rest
}: InputFieldControllerProps<TFieldValues, TFieldName>): React.ReactElement {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <InputField
      register={control.register(name, registerOptions)}
      error={error?.message}
      {...rest}
    />
  );
}

export { InputField, InputFieldController };
