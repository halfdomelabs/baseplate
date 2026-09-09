'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { HexColorInput, HexColorPicker } from 'react-colorful';

import type { FormFieldProps } from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { useFieldIds } from '#src/hooks/use-field-ids.js';
import { buttonVariants, inputVariants } from '#src/styles/index.js';
import { cn } from '#src/utils/index.js';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover.js';

export interface ColorPickerFieldProps extends FormFieldProps {
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  formatColorName?: (value: string) => string;
  value?: string;
  hideText?: boolean;
  size?: 'sm' | 'default' | 'xl';
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
  size = 'default',
  ref,
  id,
  'aria-describedby': ariaDescribedBy,
}: ColorPickerFieldProps): React.ReactElement {
  const addWrapper = label ?? error ?? description;

  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });

  const hexValue = value ? (parseColor?.(value) ?? value) : undefined;

  const handleChange = (newHexValue: string): void => {
    if (!newHexValue) return;
    const newColorValue = serializeColor?.(newHexValue) ?? newHexValue;
    onChange?.(newColorValue);
  };

  const inputComponent = (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({
            variant: 'outline',
            size: 'none',
            justify: 'start',
          }),
          className,
          'flex items-center gap-2',
          size === 'sm' && 'h-7 px-2',
          size === 'default' && 'h-8 px-2',
          size === 'xl' && 'h-11 gap-3 px-4 text-base',
          hideText ? 'justify-center' : undefined,
          disabled ? 'opacity-75' : undefined,
        )}
        {...controlProps}
        aria-invalid={!!error}
        ref={ref}
        disabled={disabled}
      >
        {hexValue && (
          <div
            className={cn(
              'rounded-sm border border-border',
              size === 'xl' ? 'h-6 w-9' : 'h-4 w-6',
            )}
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
      </PopoverTrigger>
      <PopoverContent
        sideOffset={5}
        align="start"
        className="w-auto space-y-2 rounded-md border border-border bg-card p-4"
      >
        <HexColorInput
          className={cn(inputVariants({ size }), 'p-2')}
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
      <Field
        data-invalid={!!error}
        data-disabled={disabled ?? undefined}
        className={wrapperClassName}
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
        {inputComponent}
        <FieldError {...errorProps}>{error}</FieldError>
      </Field>
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
