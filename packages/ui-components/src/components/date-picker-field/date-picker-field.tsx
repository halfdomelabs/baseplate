'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { format } from 'date-fns';
import { useId, useState } from 'react';
import { MdCalendarMonth } from 'react-icons/md';

import type { FormFieldProps } from '#src/types/form.js';

import { cn } from '#src/utils/index.js';

import { useControllerMerged } from '../../hooks/use-controller-merged.js';
import { Button } from '../button/button.js';
import { Calendar } from '../calendar/calendar.js';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form-item/form-item.js';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover.js';

export interface DatePickerFieldProps extends FormFieldProps {
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: Date | undefined) => void;
  value?: Date | undefined;
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

  const handleSelect = (date: Date | undefined): void => {
    onChange?.(date);
    if (date) {
      setOpen(false);
    }
  };

  const inputComponent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          disabled={disabled}
          id={id}
          ref={ref}
          className={cn(
            'w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <MdCalendarMonth />
          {value ? format(value, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
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
