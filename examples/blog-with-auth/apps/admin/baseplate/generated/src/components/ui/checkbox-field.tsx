'use client';

import type * as React from 'react';
import type { ComponentPropsWithRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';
import { useFieldIds } from '@src/hooks/use-field-ids';

import { Checkbox } from './checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './field';

interface CheckboxFieldProps
  extends
    Omit<
      ComponentPropsWithRef<'span'>,
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
  disabled,
  onChange,
  value,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: CheckboxFieldProps): React.ReactElement {
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
      data-invalid={!!error || undefined}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      <Checkbox
        {...props}
        {...controlProps}
        disabled={disabled}
        aria-invalid={!!error}
        onCheckedChange={(checked) => {
          onChange?.(checked);
        }}
        checked={value}
        // Support accessible button for screen readers - https://github.com/shadcn-ui/ui/issues/9249
        nativeButton={true}
        render={<button />}
      />
      <FieldContent>
        <FieldLabel {...labelProps} className="cursor-pointer">
          {label}
        </FieldLabel>
        <FieldDescription {...descriptionProps}>{description}</FieldDescription>
        <FieldError {...errorProps}>{error}</FieldError>
      </FieldContent>
    </Field>
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

  return (
    <CheckboxField
      error={error?.message}
      {...rest}
      {...field}
      value={field.value ?? false}
    />
  );
}

export { CheckboxField, CheckboxFieldController };
