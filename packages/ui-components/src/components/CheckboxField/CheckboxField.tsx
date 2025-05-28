'use client';

import type { ComponentPropsWithRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldProps } from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/useControllerMerged.js';
import { cn } from '#src/utils/index.js';

import { Checkbox } from '../Checkbox/Checkbox.js';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem.js';

interface CheckboxFieldProps
  extends Omit<
      ComponentPropsWithRef<'button'>,
      'onCheckedChange' | 'checked' | 'onChange' | 'value'
    >,
    FormFieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

/**
 * Field with label and error states that wraps a Checkbox component.
 */
function CheckboxField({
  label,
  description,
  error,
  onChange,
  value,
  className,
  ...props
}: CheckboxFieldProps): React.ReactElement {
  return (
    <FormItem error={error} className={cn('space-y-2', className)}>
      <div className="flex flex-row items-center">
        <FormControl>
          <Checkbox
            {...props}
            onCheckedChange={(checked) => {
              onChange?.(checked === true);
            }}
            checked={value}
          />
        </FormControl>
        <div className="space-y-0.5">
          <FormLabel className="cursor-pointer pl-2">{label}</FormLabel>
          <FormDescription className="pl-2">{description}</FormDescription>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  );
}

interface CheckboxFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<CheckboxFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function CheckboxFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: CheckboxFieldControllerProps<TFieldValues, TFieldName>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  return <CheckboxField error={error?.message} {...rest} {...field} />;
}

export { CheckboxField, CheckboxFieldController };
