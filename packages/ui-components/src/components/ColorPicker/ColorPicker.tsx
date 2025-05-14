import type React from 'react';
import type { ComponentPropsWithRef } from 'react';

import { HexColorInput, HexColorPicker } from 'react-colorful';

import { useControlledState } from '@src/hooks/useControlledState';
import { inputVariants } from '@src/styles';
import { cn } from '@src/utils';

import { Popover } from '../Popover/Popover';

export interface ColorFieldProps
  extends Omit<ComponentPropsWithRef<'button'>, 'value' | 'onChange'> {
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
function ColorPicker({
  className,
  placeholder,
  onChange,
  value: controlledValue,
  hideInputColor,
  hideInputText,
  formatInputText,
  ref,
  ...rest
}: ColorFieldProps): React.ReactElement {
  const [value, setValue] = useControlledState(controlledValue, onChange);
  const inputComponent = (
    <Popover>
      <Popover.Trigger asChild>
        <button
          className={cn(
            inputVariants(),
            'flex items-center space-x-2',
            className,
          )}
          {...rest}
          ref={ref}
        >
          {!hideInputColor && value && (
            <div
              className="h-4 w-6 rounded-sm border border-border"
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

export { ColorPicker };
