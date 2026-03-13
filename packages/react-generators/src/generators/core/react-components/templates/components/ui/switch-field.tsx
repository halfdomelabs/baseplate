// @ts-nocheck

'use client';

import type { FormFieldProps } from '$typesForm';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { Switch } from '$switchComponent';
import * as React from 'react';

/**
 * Field with label and error states that wraps a Switch component.
 */
export interface SwitchFieldProps
  extends
    Omit<
      React.ComponentPropsWithRef<typeof Switch>,
      'onChange' | 'value' | 'onCheckedChange' | 'checked' | 'className' | 'id'
    >,
    FormFieldProps {
  onChange?: (value: boolean) => void;
  value?: boolean;
  className?: string;
  id?: string;
}

function SwitchField({
  label,
  description,
  error,
  onChange,
  value,
  className,
  id,
  ...props
}: SwitchFieldProps): React.ReactElement {
  const switchId = React.useId();

  return (
    <Field
      orientation="horizontal"
      data-invalid={!!error}
      className={className}
      id={id}
    >
      <Switch
        {...props}
        id={switchId}
        onCheckedChange={(checked) => onChange?.(checked)}
        checked={value}
        aria-invalid={!!error}
      />
      <FieldContent>
        <FieldLabel htmlFor={switchId}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
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
