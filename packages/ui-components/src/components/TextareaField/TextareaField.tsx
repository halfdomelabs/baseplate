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
import { Textarea } from '../Textarea/Textarea';
import { FieldProps } from '@src/types/form';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface TextareaFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLTextAreaElement>,
      'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

const TextareaFieldRoot = React.forwardRef<HTMLDivElement, TextareaFieldProps>(
  ({ label, description, error, onChange, register, ...props }, ref) => {
    return (
      <FormItem ref={ref} error={error}>
        {label && <FormItem.Label>{label}</FormItem.Label>}
        <FormItem.Control>
          <Textarea
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
  ): JSX.Element => {
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
