'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldProps } from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/useControllerMerged.js';
import { cn } from '#src/utils/index.js';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem.js';
import { Switch } from '../Switch/Switch.js';

export interface SwitchFieldProps
  extends Omit<
      React.ComponentPropsWithRef<typeof Switch>,
      'onChange' | 'value' | 'onCheckedChange' | 'checked'
    >,
    FormFieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

function SwitchField({
  label,
  description,
  error,
  onChange,
  value,
  className,
  ...props
}: SwitchFieldProps): React.ReactElement {
  return (
    <FormItem error={error} className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <FormControl>
          <Switch
            onCheckedChange={(checked) => onChange?.(checked)}
            checked={value}
            {...props}
          />
        </FormControl>
        <div className="space-y-0.5">
          <FormLabel className="block">{label}</FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  );
}

export interface SwitchFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SwitchFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function SwitchFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: SwitchFieldControllerProps<TFieldValues, TFieldName>): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ control, name }, rest, rest.ref);

  return <SwitchField error={error?.message} {...rest} {...field} />;
}

export { SwitchField, SwitchFieldController };
