'use client';

import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import { useId } from 'react';
import { MdAdd, MdRemove } from 'react-icons/md';

import type { FormFieldProps } from '../../types/form.js';

import { useControllerMerged } from '../../hooks/use-controller-merged.js';
import { buttonVariants } from '../../styles/button.js';
import { inputVariants } from '../../styles/input.js';
import { cn } from '../../utils/cn.js';
import { Field, FieldDescription, FieldError, FieldLabel } from './field.js';

export interface NumberFieldProps
  extends
    Omit<
      NumberFieldPrimitive.Root.Props,
      'onValueChange' | 'value' | 'className' | 'render'
    >,
    FormFieldProps {
  onChange?: (value: number | null) => void;
  value?: number | null;
  className?: string;
}

/**
 * Numeric input backed by Base UI's NumberField, which keeps in-progress text
 * (`-`, `1.`) separate from the numeric value and emits `null` when cleared.
 *
 * https://base-ui.com/react/components/number-field
 */
function NumberField({
  label,
  description,
  error,
  disabled,
  onChange,
  value,
  className,
  ...props
}: NumberFieldProps): React.ReactElement {
  const id = useId();

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={cn('gap-1.5', className)}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberFieldPrimitive.Root
        id={id}
        value={value ?? null}
        onValueChange={(newValue) => onChange?.(newValue)}
        disabled={disabled}
        {...props}
      >
        <NumberFieldPrimitive.Group className="flex items-center gap-1.5">
          <NumberFieldPrimitive.Decrement
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'shrink-0',
            )}
            aria-label="Decrease"
          >
            <MdRemove />
          </NumberFieldPrimitive.Decrement>
          <NumberFieldPrimitive.Input
            data-slot="input"
            className={cn(inputVariants(), 'flex-1')}
            aria-invalid={!!error}
          />
          <NumberFieldPrimitive.Increment
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'shrink-0',
            )}
            aria-label="Increase"
          >
            <MdAdd />
          </NumberFieldPrimitive.Increment>
        </NumberFieldPrimitive.Group>
      </NumberFieldPrimitive.Root>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export interface NumberFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<NumberFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function NumberFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: NumberFieldControllerProps<TFieldValues, TFieldName>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ control, name }, rest);

  return (
    <NumberField
      error={error?.message}
      {...rest}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { NumberField, NumberFieldController };
