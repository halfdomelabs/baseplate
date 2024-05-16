import * as Popover from '@radix-ui/react-popover';
import { ForwardedRef, useId } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';

import { FormItem } from '../FormItem/FormItem';
import { inputVariants } from '@src/styles';
import { FieldProps } from '@src/types/form.js';
import { cn } from '@src/utils';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface ColorPickerFieldProps extends FieldProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  formatColorName?: (color: string) => string;
  value?: string;
  hideText?: boolean;
}

/**
 * Field with label and error states that wraps a ColorPicker component.
 */

function ColorPickerFieldFn(
  {
    className,
    disabled,
    placeholder,
    onChange,
    value,
    label,
    error,
    description,
    hideText,
    formatColorName,
  }: ColorPickerFieldProps,
  ref: ForwardedRef<HTMLButtonElement>,
): JSX.Element {
  const addWrapper = label ?? error ?? description;

  const id = useId();

  const inputComponent = (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            inputVariants(),
            'items-center space-x-2',
            hideText ? 'justify-center' : undefined,
            disabled ? 'opacity-75' : undefined,
            addWrapper ? null : className,
          )}
          id={id}
          ref={ref}
          disabled={disabled}
        >
          {value && (
            <div
              className="h-4 w-6 rounded border border-border"
              style={{
                backgroundColor: value,
              }}
            />
          )}
          {hideText ? null : value ? (
            <div>{formatColorName ? formatColorName(value) : value}</div>
          ) : (
            <div className="opacity-75">{placeholder}</div>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={5}
          className="space-y-2 rounded-md border border-border bg-white p-4"
        >
          <HexColorInput
            className={cn(inputVariants(), 'p-2')}
            prefixed
            color={value}
            onChange={onChange}
          />
          <HexColorPicker color={value} onChange={onChange} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );

  if (addWrapper) {
    return (
      <FormItem className={className}>
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
> extends ColorPickerFieldProps {
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
    onChange: providedOnChange,
    ...rest
  }: ColorPickerFieldControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLButtonElement>,
): JSX.Element {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  return (
    <ColorPickerFieldRoot
      error={error?.message}
      value={value}
      onChange={(val) => {
        onChange(val as PathValue<TFieldValues, TFieldName>);
        providedOnChange?.(val);
      }}
      ref={ref}
      {...rest}
    />
  );
}

const ColorPickerFieldController = genericForwardRef(
  ColorPickerFieldControllerFn,
);

export const ColorPickerField = Object.assign(ColorPickerFieldRoot, {
  Controller: ColorPickerFieldController,
});
