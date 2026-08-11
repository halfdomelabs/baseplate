// @ts-nocheck

'use client';

import type { FormFieldProps } from '$typesForm';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { cn } from '$cn';
import { Field, FieldDescription, FieldError, FieldLabel } from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { OTPField as OTPFieldPrimitive } from '@base-ui/react/otp-field';
import * as React from 'react';
import { MdRemove } from 'react-icons/md';

/**
 * A one-time password field where each character occupies its own input.
 *
 * https://base-ui.com/react/components/otp-field
 */
function InputOtp({
  className,
  ...props
}: OTPFieldPrimitive.Root.Props): React.ReactElement {
  return (
    <OTPFieldPrimitive.Root
      data-slot="input-otp"
      className={cn('flex items-center data-disabled:opacity-50', className)}
      {...props}
    />
  );
}

function InputOtpGroup({
  className,
  ...props
}: React.ComponentPropsWithRef<'div'>): React.ReactElement {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        'flex items-center rounded-lg has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

function InputOtpSlot({
  className,
  ...props
}: OTPFieldPrimitive.Input.Props): React.ReactElement {
  return (
    <OTPFieldPrimitive.Input
      data-slot="input-otp-slot"
      className={cn(
        'relative size-8 border-y border-r border-input bg-transparent text-center text-sm transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed aria-invalid:border-destructive focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:focus-visible:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

function InputOtpSeparator({
  className,
  ...props
}: OTPFieldPrimitive.Separator.Props): React.ReactElement {
  return (
    <OTPFieldPrimitive.Separator
      data-slot="input-otp-separator"
      className={cn('flex items-center px-1 text-muted-foreground', className)}
      {...props}
    >
      <MdRemove className="size-4" />
    </OTPFieldPrimitive.Separator>
  );
}

export interface InputOtpFieldProps
  extends
    Omit<
      OTPFieldPrimitive.Root.Props,
      'onValueChange' | 'value' | 'length' | 'children' | 'className'
    >,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  /** Number of characters in the code. Defaults to 6. */
  length?: number;
  /** Renders a separator between two evenly-sized groups of slots. */
  showSeparator?: boolean;
}

function InputOtpField({
  label,
  description,
  error,
  disabled,
  onChange,
  value,
  className,
  length = 6,
  showSeparator = false,
  ...props
}: InputOtpFieldProps): React.ReactElement {
  const id = React.useId();
  // With a separator the slots split into two groups; the extra slot from an
  // odd length goes to the first group. Slots share borders within a group, so
  // the rounding and the invalid ring apply per group rather than per slot.
  const splitIndex = showSeparator ? Math.ceil(length / 2) : length;

  const renderSlots = (start: number, end: number): React.ReactElement => (
    <InputOtpGroup>
      {Array.from({ length: end - start }, (_, offset) => {
        const index = start + offset;
        return (
          <InputOtpSlot
            key={index}
            aria-invalid={!!error}
            // The first input is labelled by the field label above.
            aria-label={
              index === 0 ? undefined : `Character ${index + 1} of ${length}`
            }
          />
        );
      })}
    </InputOtpGroup>
  );

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={cn('gap-1.5', className)}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputOtp
        id={id}
        length={length}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        {...props}
      >
        {renderSlots(0, splitIndex)}
        {showSeparator && (
          <>
            <InputOtpSeparator />
            {renderSlots(splitIndex, length)}
          </>
        )}
      </InputOtp>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export interface InputOtpFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<InputOtpFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function InputOtpFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: InputOtpFieldControllerProps<TFieldValues, TFieldName>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ control, name }, rest, rest.ref);

  return (
    <InputOtpField
      error={error?.message}
      {...rest}
      {...field}
      value={field.value ?? ''}
    />
  );
}

export {
  InputOtp,
  InputOtpField,
  InputOtpFieldController,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
};
