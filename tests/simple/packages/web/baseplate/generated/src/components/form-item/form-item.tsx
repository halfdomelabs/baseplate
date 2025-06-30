'use client';

import type { Label as LabelPrimitive } from 'radix-ui';

import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@src/utils/cn';

import { Label } from '../label/label';

interface FormItemContextValue {
  id: string;
  error: React.ReactNode | Error | undefined;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

interface UseFormFieldResult extends FormItemContextValue {
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}

const useFormField = (): UseFormFieldResult => {
  const itemContext = React.useContext(FormItemContext);

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  const { id, error } = itemContext;

  return {
    id,
    error,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  };
};

interface FormItemProps extends React.ComponentProps<'div'> {
  error?: React.ReactNode | Error;
}

function FormItem({
  className,
  error,
  ...props
}: FormItemProps): React.ReactElement {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id, error }}>
      <div
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<
  typeof LabelPrimitive.Root
>): React.ReactElement | null {
  const { error, formItemId } = useFormField();

  if (props.children === null || props.children === undefined) {
    return null;
  }

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: React.ComponentProps<typeof Slot.Root>): React.ReactElement {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement | null {
  const { formDescriptionId } = useFormField();

  if (props.children === null || props.children === undefined) {
    return null;
  }

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement | null {
  const { error, formMessageId } = useFormField();
  const body = error
    ? error instanceof Error
      ? error.message
      : error
    : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
