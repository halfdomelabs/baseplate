import type React from 'react';
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

import { cn, mergeRefs } from '#src/utils/index.js';

import {
  Field,
  FieldDescription,
  FieldError as FieldErrorDisplay,
  FieldLabel,
} from '../field/field.js';
import { Input } from '../input/input.js';

export interface InputFieldProps
  extends
    Omit<React.ComponentPropsWithRef<'input'>, 'onChange' | 'value'>,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

function InputField({
  label,
  description,
  error,
  onChange,
  register,
  className,
  ref,
  ...props
}: InputFieldProps): React.ReactElement {
  const id = useId();
  return (
    <Field data-invalid={!!error} className={cn('gap-1.5', className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
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
      <FieldDescription>{description}</FieldDescription>
      <FieldErrorDisplay>{error}</FieldErrorDisplay>
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
