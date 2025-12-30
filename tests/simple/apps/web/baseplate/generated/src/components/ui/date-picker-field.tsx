'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { format, parseISO } from 'date-fns';
import { useId, useState } from 'react';
import { MdCalendarMonth } from 'react-icons/md';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';
import { cn } from '@src/utils/cn';

import { Button } from './button';
import { Calendar } from './calendar';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from './form-item';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DatePickerFieldProps extends FormFieldProps {
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string | undefined) => void;
  value?: string | undefined;
  dateFormat?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect'
  >;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Field with label and error states that wraps a Calendar component for single date selection.
 */
function DatePickerField({
  className,
  wrapperClassName,
  disabled,
  placeholder = 'Pick a date',
  onChange,
  value,
  label,
  error,
  description,
  dateFormat = 'PPP',
  calendarProps,
  ref,
}: DatePickerFieldProps): React.ReactElement {
  const addWrapper = label ?? error ?? description;
  const id = useId();
  const [open, setOpen] = useState(false);

  // Parse string value to Date for Calendar component
  const dateValue = value ? parseISO(value) : undefined;

  const handleSelect = (date: Date | undefined): void => {
    if (date) {
      // Format date as YYYY-MM-DD string
      const dateString = format(date, 'yyyy-MM-dd');
      onChange?.(dateString);
      setOpen(false);
    } else {
      onChange?.(undefined);
    }
  };

  const inputComponent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!dateValue}
          disabled={disabled}
          id={id}
          ref={ref}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal',
            className,
          )}
        >
          <MdCalendarMonth />
          {dateValue ? (
            format(dateValue, dateFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          captionLayout="dropdown"
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );

  if (addWrapper) {
    return (
      <FormItem error={error} className={cn('flex gap-2', wrapperClassName)}>
        <FormLabel>{label}</FormLabel>
        <FormControl>{inputComponent}</FormControl>
        <FormDescription>{description}</FormDescription>
        <FormMessage />
      </FormItem>
    );
  }
  return inputComponent;
}

export interface DatePickerFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<DatePickerFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function DatePickerFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ref,
  ...rest
}: DatePickerFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.ReactElement {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useControllerMerged(
    {
      control,
      name,
    },
    rest,
    ref,
  );

  return <DatePickerField error={error?.message} {...rest} {...fieldProps} />;
}

export { DatePickerField, DatePickerFieldController };
