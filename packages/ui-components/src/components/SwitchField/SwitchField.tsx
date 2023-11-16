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

import { FormItem } from '../FormItem/FormItem';
import { Switch } from '../Switch/Switch';
import { FieldProps } from '@src/types/form';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface SwitchFieldProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      'onChange' | 'value'
    >,
    FieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

const SwitchFieldRoot = React.forwardRef<HTMLDivElement, SwitchFieldProps>(
  (
    { label, description, error, onChange, value, className, ...props },
    ref,
  ) => {
    return (
      <FormItem ref={ref} error={error} className={cn('space-y-2', className)}>
        <div className="flex flex-row items-center space-x-4">
          <FormItem.Control>
            <Switch
              onCheckedChange={(checked) => onChange?.(checked)}
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

SwitchFieldRoot.displayName = 'SwitchField';

export interface SwitchFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends SwitchFieldProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

const SwitchFieldController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      registerOptions,
      ...rest
    }: SwitchFieldControllerProps<TFieldValues, TFieldName>,
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
      <SwitchFieldRoot
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
  'SwitchFieldController',
);

export const SwitchField = Object.assign(SwitchFieldRoot, {
  Controller: SwitchFieldController,
});
