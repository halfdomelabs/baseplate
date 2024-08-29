'use client';

import React, { useMemo } from 'react';
import { MdCheck } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';

import { Badge } from '../Badge/Badge';
import { Command } from '../Command/Command';
import { Popover } from '../Popover/Popover';
import { useControlledState } from '@src/hooks';
import {
  inputVariants,
  selectContentVariants,
  selectItemVariants,
} from '@src/styles';
import { cn, mergeRefs } from '@src/utils';

/* eslint-disable react/prop-types */

interface MultiComboboxContextValue {
  selectedValues: MultiComboboxOption[];
  onSelect: (
    value: string,
    label: string | undefined,
    selected: boolean,
  ) => void;
  disabled?: boolean;
}

const MultiComboboxContext =
  React.createContext<MultiComboboxContextValue | null>(null);

interface MultiComboboxOption {
  label?: string;
  value: string;
}

interface MultiComboboxProps {
  children?: React.ReactNode;
  value?: MultiComboboxOption[];
  onChange?: (value: MultiComboboxOption[]) => void;
  disabled?: boolean;
}

function MultiComboboxRoot({
  children,
  value,
  onChange,
  disabled,
}: MultiComboboxProps): JSX.Element {
  const [selectedValues, setSelectedValues] = useControlledState(
    value,
    onChange,
    [],
  );
  const contextValue: MultiComboboxContextValue = useMemo(
    () => ({
      selectedValues,
      onSelect: (value, label, selected) => {
        if (selected) {
          setSelectedValues([...selectedValues, { label, value }]);
        } else {
          setSelectedValues(selectedValues.filter((v) => v.value !== value));
        }
      },
      disabled,
    }),
    [selectedValues, setSelectedValues, disabled],
  );

  return (
    <MultiComboboxContext.Provider value={contextValue}>
      <Popover>{children}</Popover>
    </MultiComboboxContext.Provider>
  );
}

export function useMultiComboboxContext(): MultiComboboxContextValue {
  const value = React.useContext(MultiComboboxContext);

  if (!value) {
    throw new Error(
      `useMultiComboboxContext must be used inside a MultiComboboxContext provider`,
    );
  }

  return value;
}

interface MultiComboboxInputProps {
  className?: string;
  placeholder?: string;
}

const MultiComboboxInput = React.forwardRef<
  HTMLButtonElement,
  MultiComboboxInputProps
>(({ className, placeholder }, ref) => {
  const { selectedValues, disabled } = useMultiComboboxContext();

  return (
    <Popover.Trigger asChild>
      <button
        className={cn(
          inputVariants(),
          'flex items-center space-x-2',
          className,
        )}
        disabled={disabled}
        ref={ref}
      >
        <div
          className={cn(
            'flex flex-1 items-center gap-2',
            disabled && 'opacity-50',
          )}
        >
          {selectedValues.length === 0 && (
            <div className="text-muted-foreground">{placeholder}</div>
          )}
          {selectedValues.length > 0 && (
            <>
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal sm:hidden"
              >
                {selectedValues.length} selected
              </Badge>
              <div className="hidden space-x-1 sm:flex">
                {selectedValues.length > 3 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  selectedValues.map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="rounded-sm px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <RxCaretSort className="size-4" />
      </button>
    </Popover.Trigger>
  );
});

MultiComboboxInput.displayName = 'MultiComboboxInput';

interface MultiComboboxContentProps
  extends React.RefAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  style?: React.CSSProperties;
}

function MultiComboboxContent({
  children,
  className,
  maxHeight = '320px',
  style,
  ...rest
}: MultiComboboxContentProps): React.JSX.Element {
  return (
    <Popover.Content
      align="start"
      padding="none"
      className={cn(selectContentVariants({ popper: 'active' }), className)}
      style={
        {
          '--max-popover-height': maxHeight,
          ...style,
        } as Record<string, string>
      }
      {...rest}
      data-combobox-content=""
    >
      <Command>
        <Command.Input />
        <Command.List>{children}</Command.List>
      </Command>
    </Popover.Content>
  );
}

type MultiComboboxEmptyProps = React.HTMLAttributes<HTMLDivElement>;

const MultiComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  MultiComboboxEmptyProps
>(({ className, ...props }: MultiComboboxEmptyProps, ref) => (
  <Command.Empty
    className={cn('p-2 text-sm', className)}
    {...props}
    ref={ref}
  />
));

MultiComboboxEmpty.displayName = 'MultiComboboxEmpty';

const MultiComboboxGroup = Command.Group;

interface MultiComboboxItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  disabled?: boolean;
  value: string;
  label?: string;
}

const MultiComboboxItem = React.forwardRef<
  HTMLDivElement,
  MultiComboboxItemProps
>(({ value, className, label, children, ...rest }, ref) => {
  const { selectedValues, onSelect } = useMultiComboboxContext();

  const isSelected = selectedValues.some((v) => v.value === value);

  const itemRef = React.useRef<HTMLDivElement>(null);

  return (
    <Command.Item
      value={value}
      onSelect={(value) => {
        const itemLabel = label ?? itemRef.current?.textContent ?? undefined;
        onSelect(value, itemLabel, !isSelected);
      }}
      className={cn(selectItemVariants(), className)}
      {...rest}
      ref={mergeRefs([ref, itemRef])}
    >
      <div
        className={cn(
          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
          isSelected ? 'opacity-100' : '[&_svg]:invisible',
        )}
      >
        <MdCheck className={'size-4'} />
      </div>
      {children}
    </Command.Item>
  );
});

MultiComboboxItem.displayName = 'MultiComboboxItem';

export const MultiCombobox = Object.assign(MultiComboboxRoot, {
  Input: MultiComboboxInput,
  Content: MultiComboboxContent,
  Empty: MultiComboboxEmpty,
  Group: MultiComboboxGroup,
  Item: MultiComboboxItem,
});
