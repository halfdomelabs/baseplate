import React, { ForwardedRef } from 'react';
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
  get,
  useFormState,
} from 'react-hook-form';

import { FormItem } from '../FormItem/FormItem';
import { Input } from '../Input/Input';
import { FieldProps } from '@src/types/form';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface InputFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
  wrapperClassName?: string;
}

const InputFieldRoot = React.forwardRef<HTMLDivElement, InputFieldProps>(
  (
    {
      label,
      description,
      error,
      onChange,
      register,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    return (
      <FormItem
        ref={ref}
        error={error}
        className={cn('flex flex-col gap-1.5', wrapperClassName)}
      >
        {label && <FormItem.Label>{label}</FormItem.Label>}
        <FormItem.Control>
          <Input
            onChange={onChange && ((e) => onChange?.(e.target.value))}
            {...props}
            {...register}
          />
        </FormItem.Control>
        {description && (
          <FormItem.Description>{description}</FormItem.Description>
        )}
        {error && <FormItem.Error>{error}</FormItem.Error>}
      </FormItem>
    );
  },
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
  ): JSX.Element => {
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
