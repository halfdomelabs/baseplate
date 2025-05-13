import type React from 'react';
import type { ForwardedRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import * as Popover from '@radix-ui/react-popover';
import { useId } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import type { FieldProps } from '@src/types/form.js';

import { useControllerMerged } from '@src/hooks/useControllerMerged';
import { buttonVariants, inputVariants } from '@src/styles';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import { FormItem } from '../FormItem/FormItem';

export interface ColorPickerFieldProps extends FieldProps {
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  formatColorName?: (color: string) => string;
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
}

/**
 * Field with label and error states that wraps a ColorPicker component.
 */

function ColorPickerFieldFn(
  {
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
  }: ColorPickerFieldProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
  const addWrapper = label ?? error ?? description;

  const id = useId();

  const hexValue = value ? (parseColor?.(value) ?? value) : undefined;

  const handleChange = (newHexValue: string): void => {
    if (!newHexValue) return;
    const newColorValue = serializeColor?.(newHexValue) ?? newHexValue;
    onChange?.(newColorValue);
  };

  const inputComponent = (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            buttonVariants({
              variant: 'outline',
              size: 'none',
              justify: 'start',
            }),
            className,
            'flex h-8 items-center px-2',
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
            <div>{formatColorName ? formatColorName(hexValue) : hexValue}</div>
          ) : (
            <div className="opacity-75">{placeholder}</div>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={5}
          align="start"
          collisionPadding={{ bottom: 50 }}
          className="bg-white space-y-2 rounded-md border border-border p-4"
        >
          <HexColorInput
            className={cn(inputVariants(), 'p-2')}
            prefixed
            color={hexValue ?? ''}
            onChange={handleChange}
          />
          <HexColorPicker color={hexValue ?? ''} onChange={handleChange} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );

  if (addWrapper) {
    return (
      <FormItem error={error} className={cn('flex gap-2', wrapperClassName)}>
        {label && <FormItem.Label>{label}</FormItem.Label>}
        <FormItem.Control>{inputComponent}</FormItem.Control>
        {error ? (
          <FormItem.Error>{error}</FormItem.Error>
        ) : (
          description && (
            <FormItem.Description>{description}</FormItem.Description>
          )
        )}
      </FormItem>
    );
  }
  return inputComponent;
}

/**
 * A color picker field.
 */
const ColorPickerFieldRoot = genericForwardRef(ColorPickerFieldFn);

export interface ColorPickerFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ColorPickerFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ColorPickerFieldControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    control,
    name,
    ...rest
  }: ColorPickerFieldControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
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
    <ColorPickerFieldRoot error={error?.message} {...rest} {...fieldProps} />
  );
}

const ColorPickerFieldController = genericForwardRef(
  ColorPickerFieldControllerFn,
);

export const ColorPickerField = Object.assign(ColorPickerFieldRoot, {
  Controller: ColorPickerFieldController,
});
