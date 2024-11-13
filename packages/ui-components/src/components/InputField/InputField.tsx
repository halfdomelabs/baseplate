import type { ForwardedRef } from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from 'react-hook-form';

import React from 'react';
import { get, useFormState } from 'react-hook-form';

import type { FieldProps } from '@src/types/form';

import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import { FormItem } from '../FormItem/FormItem';
import { Input } from '../Input/Input';

export interface InputFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

const InputFieldRoot = React.forwardRef<HTMLDivElement, InputFieldProps>(
  ({ label, description, error, onChange, register, ...props }, ref) => (
    <FormItem ref={ref} error={error}>
      {label && <FormItem.Label>{label}</FormItem.Label>}
      <FormItem.Control>
        <Input
          onChange={
            onChange &&
            ((e) => {
              onChange(e.target.value);
            })
          }
          {...props}
          {...register}
        />
      </FormItem.Control>
      {description && (
        <FormItem.Description>{description}</FormItem.Description>
      )}
      {error && <FormItem.Error>{error}</FormItem.Error>}
    </FormItem>
  ),
);
InputFieldRoot.displayName = 'InputField';

export interface InputFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends InputFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}
const InputFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      registerOptions,
      ...rest
    }: InputFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.JSX.Element => {
    const { errors } = useFormState({ control, name });
    const error = get(errors, name) as FieldError | undefined;

    return (
      <InputFieldRoot
        register={control.register(name, registerOptions)}
        error={error?.message}
        ref={ref}
        {...rest}
      />
    );
  },
  'InputFieldController',
);

export const InputField = Object.assign(InputFieldRoot, {
  Controller: InputFieldController,
});
