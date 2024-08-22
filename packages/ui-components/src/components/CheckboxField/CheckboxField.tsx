import * as SwitchPrimitives from '@radix-ui/react-switch';
import React, { ForwardedRef } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Checkbox } from '../Checkbox/Checkbox';
import { FormItem } from '../FormItem/FormItem';
import { useControllerMerged } from '@src/hooks/useControllerMerged';
import { FieldProps } from '@src/types/form';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface CheckboxFieldProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      'onCheckedChange' | 'checked' | 'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

/**
 * Field with label and error states that wraps a Checkbox component.
 */

const CheckboxFieldRoot = React.forwardRef<
  HTMLButtonElement,
  CheckboxFieldProps
>(
  (
    { label, description, error, onChange, onBlur, value, className, ...props },
    ref,
  ) => {
    return (
      <FormItem error={error} className={cn('space-y-2', className)}>
        <div className="flex flex-row items-center space-x-4">
          <FormItem.Control>
            <Checkbox
              ref={ref}
              {...props}
              onCheckedChange={(checked) => {
                onChange?.(checked === true);
              }}
              checked={value}
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
> extends Omit<CheckboxFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

const CheckboxFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      ...rest
    }: CheckboxFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLButtonElement>,
  ): JSX.Element => {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    return <CheckboxFieldRoot error={error?.message} {...rest} {...field} />;
  },
  'CheckboxFieldController',
);

export const CheckboxField = Object.assign(CheckboxFieldRoot, {
  Controller: CheckboxFieldController,
});
