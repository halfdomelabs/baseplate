// @ts-nocheck

'use client';

import type { FormFieldProps } from '$typesForm';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { cn } from '$cn';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { useFieldIds } from '$hooksUseFieldIds';
import { buttonVariants } from '$stylesButton';
import { inputVariants } from '$stylesInput';
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import { MdAdd, MdRemove } from 'react-icons/md';

export interface NumberFieldProps
  extends
    Omit<
      NumberFieldPrimitive.Root.Props,
      'onValueChange' | 'value' | 'className' | 'render'
    >,
    FormFieldProps,
    VariantProps<typeof inputVariants> {
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
  size,
  height,
  background,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: NumberFieldProps): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });
  // `VariantProps` admits null, and the steppers index by the resolved value.
  const stepperSize = {
    sm: 'icon-sm',
    default: 'icon',
    xl: 'icon-xl',
  } as const;
  const resolvedSize = size ?? 'default';

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      {(!!label || !!description) && (
        <FieldContent>
          {label && <FieldLabel {...labelProps}>{label}</FieldLabel>}
          {description && (
            <FieldDescription {...descriptionProps}>
              {description}
            </FieldDescription>
          )}
        </FieldContent>
      )}
      {/* Base UI routes Root's id to the input, so the label resolves through it. */}
      <NumberFieldPrimitive.Root
        id={controlProps.id}
        value={value ?? null}
        onValueChange={(newValue) => onChange?.(newValue)}
        disabled={disabled}
        {...props}
      >
        <NumberFieldPrimitive.Group className="flex items-center gap-1.5">
          <NumberFieldPrimitive.Decrement
            className={cn(
              buttonVariants({
                variant: 'outline',
                size: stepperSize[resolvedSize],
              }),
              'shrink-0',
            )}
            aria-label="Decrease"
          >
            <MdRemove />
          </NumberFieldPrimitive.Decrement>
          <NumberFieldPrimitive.Input
            data-slot="input"
            className={cn(
              inputVariants({ size, height, background }),
              'flex-1',
            )}
            aria-invalid={!!error}
            aria-describedby={controlProps['aria-describedby']}
          />
          <NumberFieldPrimitive.Increment
            className={cn(
              buttonVariants({
                variant: 'outline',
                size: stepperSize[resolvedSize],
              }),
              'shrink-0',
            )}
            aria-label="Increase"
          >
            <MdAdd />
          </NumberFieldPrimitive.Increment>
        </NumberFieldPrimitive.Group>
      </NumberFieldPrimitive.Root>
      <FieldError {...errorProps}>{error}</FieldError>
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
