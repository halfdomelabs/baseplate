'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import * as React from 'react';

import type { FormFieldProps } from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/use-controller-merged.js';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';
import { Switch } from '../switch/switch.js';

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
        // Support accessible button for screen readers - https://github.com/shadcn-ui/ui/issues/9249
        nativeButton={true}
        render={<button />}
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
