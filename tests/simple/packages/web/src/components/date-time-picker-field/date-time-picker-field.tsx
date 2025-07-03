'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { format, parseISO, set } from 'date-fns';
import { useId, useState } from 'react';
import { MdSchedule } from 'react-icons/md';

import type { FormFieldProps } from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';
import { cn } from '@src/utils/cn';

import { Button } from '../button/button';
import { Calendar } from '../calendar/calendar';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form-item/form-item';
import { Input } from '../input/input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';

export interface DateTimePickerFieldProps extends FormFieldProps {
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string | undefined) => void;
  value?: string | undefined;
  dateTimeFormat?: string;
  showSeconds?: boolean;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect'
  >;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Field with label and error states that wraps a Calendar and time input for date-time selection.
 */
function DateTimePickerField({
  className,
  wrapperClassName,
  disabled,
  placeholder = 'Pick date and time',
  onChange,
  value,
  label,
  error,
  description,
  dateTimeFormat = 'PPP pp',
  showSeconds = false,
  calendarProps,
  ref,
}: DateTimePickerFieldProps): React.ReactElement {
  const addWrapper = label ?? error ?? description;
  const id = useId();
  const [open, setOpen] = useState(false);

  // Parse string value to Date for internal operations
  const dateTimeValue = value ? parseISO(value) : undefined;

  const handleDateSelect = (date: Date | undefined): void => {
    if (!date) {
      onChange?.(undefined);
      return;
    }

    let newDate: Date;
    if (dateTimeValue) {
      // Preserve existing time when changing date
      newDate = set(date, {
        hours: dateTimeValue.getHours(),
        minutes: dateTimeValue.getMinutes(),
        seconds: showSeconds ? dateTimeValue.getSeconds() : 0,
      });
    } else {
      // Set default time to current time or noon if no current time
      const now = new Date();
      newDate = set(date, {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: showSeconds ? now.getSeconds() : 0,
      });
    }
    // Convert to ISO string
    onChange?.(newDate.toISOString());
  };

  const handleTimeChange = (timeString: string): void => {
    if (!dateTimeValue) {
      // If no date selected, use today's date
      const today = new Date();
      const [hours, minutes, seconds = 0] = timeString
        .split(':')
        .map((n) => (n ? Number(n) : 0));
      const newDate = set(today, {
        hours,
        minutes,
        seconds: showSeconds ? seconds : 0,
      });
      onChange?.(newDate.toISOString());
      return;
    }

    const [hours, minutes, seconds = 0] = timeString
      .split(':')
      .map((n) => (n ? Number(n) : 0));
    const newDate = set(dateTimeValue, {
      hours,
      minutes,
      seconds: showSeconds ? seconds : 0,
    });
    onChange?.(newDate.toISOString());
  };

  const formatTimeValue = (date: Date | undefined): string => {
    if (!date) return '';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    if (showSeconds) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}`;
  };

  const inputComponent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!dateTimeValue}
          disabled={disabled}
          id={id}
          ref={ref}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal',
            className,
          )}
        >
          <MdSchedule />
          {dateTimeValue ? (
            format(dateTimeValue, dateTimeFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-3 p-3">
          <Calendar
            mode="single"
            selected={dateTimeValue}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            {...calendarProps}
          />
          <div className="space-y-2">
            <div className="text-sm font-medium">Time</div>
            <Input
              type="time"
              step={showSeconds ? 1 : 60}
              value={formatTimeValue(dateTimeValue)}
              onChange={(e) => {
                handleTimeChange(e.target.value);
              }}
              className="w-full"
            />
          </div>
        </div>
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

export interface DateTimePickerFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<DateTimePickerFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function DateTimePickerFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ref,
  ...rest
}: DateTimePickerFieldControllerProps<
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

  return (
    <DateTimePickerField error={error?.message} {...rest} {...fieldProps} />
  );
}

export { DateTimePickerField, DateTimePickerFieldController };
