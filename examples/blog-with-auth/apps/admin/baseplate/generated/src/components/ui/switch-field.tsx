'use client';

import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';
import { useFieldIds } from '@src/hooks/use-field-ids';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './field';
import { Switch } from './switch';

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
}

function SwitchField({
  label,
  description,
  error,
  disabled,
  onChange,
  value,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: SwitchFieldProps): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });

  return (
    <Field
      orientation="horizontal"
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      <Switch
        {...props}
        {...controlProps}
        disabled={disabled}
        onCheckedChange={(checked) => onChange?.(checked)}
        checked={value}
        aria-invalid={!!error}
        // Support accessible button for screen readers - https://github.com/shadcn-ui/ui/issues/9249
        nativeButton={true}
        render={<button />}
      />
      <FieldContent>
        <FieldLabel {...labelProps}>{label}</FieldLabel>
        <FieldDescription {...descriptionProps}>{description}</FieldDescription>
        <FieldError {...errorProps}>{error}</FieldError>
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

  return (
    <SwitchField
      error={error?.message}
      {...rest}
      {...field}
      value={field.value ?? false}
    />
  );
}

export { SwitchField, SwitchFieldController };
