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

import type { FormFieldProps } from '@src/types/form';

import { cn } from '@src/utils/cn';
import { mergeRefs } from '@src/utils/merge-refs';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from './form-item';
import { Input } from './input';

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
  return (
    <FormItem error={error} className={cn('flex flex-col gap-1.5', className)}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          onChange={
            onChange &&
            ((e) => {
              onChange(e.target.value);
            })
          }
          ref={mergeRefs(ref, register?.ref)}
          {...props}
          {...register}
        />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
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
