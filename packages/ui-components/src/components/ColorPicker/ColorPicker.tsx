import React, { ForwardedRef, HTMLAttributes, forwardRef } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import { Popover } from '../Popover/Popover';
import { useControlledState } from '@src/hooks/useControlledState';
import { inputVariants } from '@src/styles';
import { cn } from '@src/utils';

export interface ColorFieldProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  hideInputColor?: boolean;
  hideInputText?: boolean;
  formatInputText?: (value: string) => string;
}

/**
 * A control that allows users to select a color.
 */

const ColorPickerRoot = forwardRef(
  (
    {
      className,
      placeholder,
      onChange,
      value: controlledValue,
      hideInputColor,
      hideInputText,
      formatInputText,
      ...rest
    }: ColorFieldProps,
    ref: ForwardedRef<HTMLButtonElement>
  ): React.JSX.Element => {
    const [value, setValue] = useControlledState(controlledValue, onChange);
    const inputComponent = (
      <Popover>
        <Popover.Trigger asChild>
          <button
            className={cn(
              inputVariants(),
              'flex items-center space-x-2',
              className
            )}
            {...rest}
            ref={ref}
          >
            {!hideInputColor && value && (
              <div
                className="h-4 w-6 rounded border border-border"
                style={{
                  backgroundColor: value,
                }}
              />
            )}
            {!hideInputText && value ? (
              <div>{formatInputText ? formatInputText(value) : value}</div>
            ) : (
              <div className="text-muted-foreground">{placeholder}</div>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Content className="space-y-2" align="start" width="none">
          <HexColorInput
            className={cn(inputVariants(), 'p-2')}
            prefixed
            color={value}
            onChange={setValue}
          />
          <HexColorPicker color={value} onChange={setValue} />
        </Popover.Content>
      </Popover>
    );

    return inputComponent;
  }
);

ColorPickerRoot.displayName = 'ColorPicker';

export const ColorPicker = ColorPickerRoot;
