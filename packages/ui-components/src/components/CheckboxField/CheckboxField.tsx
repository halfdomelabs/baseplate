import * as SwitchPrimitives from '@radix-ui/react-switch';
import React, { ForwardedRef } from 'react';
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  PathValue,
  RegisterOptions,
  get,
  useController,
} from 'react-hook-form';

import { Checkbox } from '../Checkbox/Checkbox';
import { FormItem } from '../FormItem/FormItem';
import { FieldProps } from '@src/types/form';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface CheckboxFieldProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

/**
 * Field with label and error states that wraps a Checkbox component.
 */

const CheckboxFieldRoot = React.forwardRef<HTMLDivElement, CheckboxFieldProps>(
  (
    { label, description, error, onChange, value, className, ...props },
    ref,
  ) => {
    return (
      <FormItem ref={ref} error={error} className={cn('space-y-2', className)}>
        <div className="flex flex-row items-center space-x-4">
          <FormItem.Control>
            <Checkbox
              onCheckedChange={(checked) => onChange?.(checked === true)}
              checked={value}
              {...props}
            />
          </FormItem.Control>
          <div className="space-y-0.5">
            {label && <FormItem.Label>{label}</FormItem.Label>}
            {description && (
              <FormItem.Description>{description}</FormItem.Description>
            )}
          </div>
        </div>
        {error && <FormItem.Error>{error}</FormItem.Error>}
      </FormItem>
    );
  },
);

CheckboxFieldRoot.displayName = 'CheckboxField';

export interface CheckboxFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends CheckboxFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

const CheckboxFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      registerOptions,
      ...rest
    }: CheckboxFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLInputElement>,
  ): JSX.Element => {
    const {
      field: { onChange, value },
      formState: { errors },
    } = useController({
      control,
      name,
    });
    const error = get(errors, name) as FieldError | undefined;

    return (
      <CheckboxFieldRoot
        onCheckedChange={(checked) =>
          onChange(checked as PathValue<TFieldValues, TFieldName>)
        }
        checked={value}
        error={error?.message}
        ref={ref}
        {...rest}
      />
    );
  },
  'CheckboxFieldController',
);

export const CheckboxField = Object.assign(CheckboxFieldRoot, {
  Controller: CheckboxFieldController,
});
