'use client';

import type { ComponentPropsWithRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import * as React from 'react';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';

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
  onChange,
  value,
  className,
  ...props
}: CheckboxFieldProps): React.ReactElement {
  const id = React.useId();

  return (
    <Field
      orientation="horizontal"
      data-invalid={!!error || undefined}
      className={className}
    >
      <Checkbox
        {...props}
        id={id}
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
        <FieldLabel htmlFor={id} className="cursor-pointer">
          {label}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
        <FieldError>{error}</FieldError>
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

  return <CheckboxField error={error?.message} {...rest} {...field} />;
}

export { CheckboxField, CheckboxFieldController };
