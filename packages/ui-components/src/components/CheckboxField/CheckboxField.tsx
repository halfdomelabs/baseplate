import type * as SwitchPrimitives from '@radix-ui/react-switch';
import type { ForwardedRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import React from 'react';

import type { FieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/useControllerMerged';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import { Checkbox } from '../Checkbox/Checkbox';
import { FormItem } from '../FormItem/FormItem';

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
  ) => (
      <FormItem error={error} className={cn('space-y-2', className)}>
        <div className="flex flex-row items-center">
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
            {label && (
              <FormItem.Label className="cursor-pointer pl-2">
                {label}
              </FormItem.Label>
            )}
            {description && (
              <FormItem.Description className="pl-2">
                {description}
              </FormItem.Description>
            )}
          </div>
        </div>
        {error && <FormItem.Error>{error}</FormItem.Error>}
      </FormItem>
    ),
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
