import * as Popover from '@radix-ui/react-popover';
import { clsx } from 'clsx';
import { ForwardedRef, useId } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';
import { LabellableComponent } from '@src/types/form.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';
import { FormLabel } from '../FormLabel/FormLabel.js';

export interface ColorInputProps extends LabellableComponent {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  formatLabel?: (color: string) => string;
  value?: string;
  hideText?: boolean;
}

function ColorInputFn(
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
    formatLabel,
  }: ColorInputProps,
  ref: ForwardedRef<HTMLButtonElement>
): JSX.Element {
  const addWrapper = label ?? error ?? description;

  const id = useId();

  const inputComponent = (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={clsx(
            'ux-input',
            'flex h-9 items-center space-x-2 p-2.5',
            hideText ? 'justify-center' : undefined,
            disabled ? 'opacity-75' : undefined,
            addWrapper ? null : className
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
            <div>{formatLabel ? formatLabel(value) : value}</div>
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
            className="ux-input p-2"
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
      <div className={clsx('space-y-2', className)}>
        {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
        {inputComponent}
        {error ? (
          <FormError>{error}</FormError>
        ) : (
          description && <FormDescription>{description}</FormDescription>
        )}
      </div>
    );
  }
  return inputComponent;
}

/**
 * A text input field.
 */
const ColorInputRoot = genericForwardRef(ColorInputFn);

export interface ColorInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ColorInputProps {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ColorInputControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    control,
    name,
    onChange: providedOnChange,
    ...rest
  }: ColorInputControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLButtonElement>
): JSX.Element {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  return (
    <ColorInputRoot
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

const ColorInputController = genericForwardRef(ColorInputControllerFn);

export const ColorInput = Object.assign(ColorInputRoot, {
  Controller: ColorInputController,
});
