import type * as LabelPrimitive from '@radix-ui/react-label';

import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@src/utils';

import { Label } from '../Label/Label.js';

/* eslint-disable react/prop-types */

interface FormItemContextValue {
  id: string;
  error?: React.ReactNode | Error;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

/**
 * Wraps a control and allows use of an a11y-enabled label, description, and error message.
 *
 * https://ui.shadcn.com/docs/components/form
 */
const FormItemRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { error?: React.ReactNode | Error }
>(({ className, error, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id, error }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItemRoot.displayName = 'FormItem';

interface UseFormFieldResult {
  id: string;
  error?: React.ReactNode | Error;
  formLabelId: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}

export function useFormField(): UseFormFieldResult {
  const itemContext = React.useContext(FormItemContext);

  const { id, error } = itemContext;

  if (!id) {
    throw new Error(`useFormField must be used in a FormItemContext`);
  }

  return {
    id,
    error,
    formLabelId: `${id}-form-item-label`,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  };
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId, formLabelId } = useFormField();

  return (
    <Label
      id={formLabelId}
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId, formLabelId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-labelledby={formLabelId}
      aria-describedby={
        error
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const errorText = error instanceof Error ? error.message : error;
  const body = errorText ? errorText : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormError.displayName = 'FormError';

export const FormItem = Object.assign(FormItemRoot, {
  Label: FormLabel,
  Control: FormControl,
  Description: FormDescription,
  Error: FormError,
});
