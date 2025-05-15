'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useId } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import type { FormFieldProps } from '@src/types/form.js';

import { useControllerMerged } from '@src/hooks/useControllerMerged';
import { buttonVariants, inputVariants } from '@src/styles';
import { cn } from '@src/utils';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';

export interface ColorPickerFieldProps extends FormFieldProps {
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  formatColorName?: (value: string) => string;
  value?: string;
  hideText?: boolean;
  /**
   * Parse a color string into a hex color.
   * @param color - The color string to parse.
   * @returns The hex color.
   */
  parseColor?: (color: string) => string;
  /**
   * Serialize a hex color into a color string.
   * @param hex - The hex color to serialize.
   * @returns The color string.
   */
  serializeColor?: (hex: string) => string;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Field with label and error states that wraps a ColorPicker component.
 */
function ColorPickerField({
  className,
  wrapperClassName,
  disabled,
  placeholder,
  onChange,
  value,
  label,
  error,
  description,
  hideText,
  formatColorName,
  parseColor,
  serializeColor,
  ref,
}: ColorPickerFieldProps): React.ReactElement {
  const addWrapper = label ?? error ?? description;

  const id = useId();

  const hexValue = value ? (parseColor?.(value) ?? value) : undefined;

  const handleChange = (newHexValue: string): void => {
    if (!newHexValue) return;
    const newColorValue = serializeColor?.(newHexValue) ?? newHexValue;
    onChange?.(newColorValue);
  };

  const inputComponent = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            buttonVariants({
              variant: 'outline',
              size: 'none',
              justify: 'start',
            }),
            className,
            'flex h-8 items-center gap-2 px-2',
            hideText ? 'justify-center' : undefined,
            disabled ? 'opacity-75' : undefined,
          )}
          id={id}
          ref={ref}
          disabled={disabled}
        >
          {hexValue && (
            <div
              className="h-4 w-6 rounded-sm border border-border"
              style={{
                backgroundColor: hexValue,
              }}
            />
          )}
          {hideText ? null : hexValue ? (
            <div>
              {formatColorName && value ? formatColorName(value) : hexValue}
            </div>
          ) : (
            <div className="opacity-75">{placeholder}</div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={5}
        align="start"
        collisionPadding={{ bottom: 50 }}
        className="bg-white space-y-2 rounded-md border border-border p-4"
        width="none"
      >
        <HexColorInput
          className={cn(inputVariants(), 'p-2')}
          prefixed
          color={hexValue ?? ''}
          onChange={handleChange}
        />
        <HexColorPicker color={hexValue ?? ''} onChange={handleChange} />
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

export interface ColorPickerFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ColorPickerFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ColorPickerFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  ref,
  ...rest
}: ColorPickerFieldControllerProps<
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

  return <ColorPickerField error={error?.message} {...rest} {...fieldProps} />;
}

export { ColorPickerField, ColorPickerFieldController };
