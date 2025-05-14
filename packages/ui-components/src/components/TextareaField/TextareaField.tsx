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

import type { FormFieldProps } from '@src/types/form';

import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem';
import { Textarea } from '../Textarea/Textarea';

export interface TextareaFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLTextAreaElement>,
      'onChange' | 'value'
    >,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

const TextareaFieldRoot = React.forwardRef<HTMLDivElement, TextareaFieldProps>(
  ({ label, description, error, onChange, register, ...props }, ref) => (
    <FormItem ref={ref} error={error}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Textarea
          onChange={
            onChange &&
            ((e) => {
              onChange(e.target.value);
            })
          }
          {...props}
          {...register}
        />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  ),
);
TextareaFieldRoot.displayName = 'TextareaField';

export interface TextareaFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends TextareaFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}
const TextareaFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      registerOptions,
      ...rest
    }: TextareaFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.JSX.Element => {
    const { errors } = useFormState({ control, name });
    const error = get(errors, name) as FieldError | undefined;

    return (
      <TextareaFieldRoot
        register={control.register(name, registerOptions)}
        error={error?.message}
        ref={ref}
        {...rest}
      />
    );
  },
  'TextareaFieldController',
);

export const TextareaField = Object.assign(TextareaFieldRoot, {
  Controller: TextareaFieldController,
});
