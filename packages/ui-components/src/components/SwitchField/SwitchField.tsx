import type * as SwitchPrimitives from '@radix-ui/react-switch';
import type { ForwardedRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import React from 'react';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/useControllerMerged';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem';
import { Switch } from '../Switch/Switch';

export interface SwitchFieldProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      'onChange' | 'value' | 'onCheckedChange' | 'checked'
    >,
    FormFieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

const SwitchFieldRoot = React.forwardRef<HTMLButtonElement, SwitchFieldProps>(
  (
    { label, description, error, onChange, value, className, ...props },
    ref,
  ) => (
    <FormItem error={error} className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <FormControl>
          <Switch
            onCheckedChange={(checked) => onChange?.(checked)}
            checked={value}
            {...props}
            ref={ref}
          />
        </FormControl>
        <div className="space-y-0.5">
          <FormLabel className="block">{label}</FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  ),
);

SwitchFieldRoot.displayName = 'SwitchField';

export interface SwitchFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SwitchFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

const SwitchFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      ...rest
    }: SwitchFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLButtonElement>,
  ): React.JSX.Element => {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ control, name }, rest, ref);

    return <SwitchFieldRoot error={error?.message} {...rest} {...field} />;
  },
  'SwitchFieldController',
);

export const SwitchField = Object.assign(SwitchFieldRoot, {
  Controller: SwitchFieldController,
});
