'use client';

import React, { useId, useMemo, useState } from 'react';
import { MdCheck, MdClose } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';

import { useControlledState } from '@src/hooks';
import {
  inputVariants,
  selectContentVariants,
  selectItemVariants,
} from '@src/styles';
import { cn, mergeRefs } from '@src/utils';

import { Badge } from '../Badge/Badge';
import { Command } from '../Command/Command';
import { Popover } from '../Popover/Popover';

 

interface MultiComboboxContextValue {
  selectedValues: MultiComboboxOption[];
  onSelect: (
    value: string,
    label: string | undefined,
    selected: boolean,
  ) => void;
  disabled?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  inputId: string;
  filterId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();
  const filterId = useId();
  const contextValue: MultiComboboxContextValue = useMemo(
    () => ({
      selectedValues,
      onSelect: (value, label, selected) => {
        setSearchQuery('');
        if (selected) {
          setSelectedValues([...selectedValues, { label, value }]);
        } else {
          setSelectedValues(selectedValues.filter((v) => v.value !== value));
        }
      },
      disabled,
      isOpen,
      setIsOpen: (open) => {
        setSearchQuery('');
        setIsOpen(open);
      },
      inputId,
      filterId,
      searchQuery,
      setSearchQuery,
    }),
    [
      selectedValues,
      setSelectedValues,
      disabled,
      isOpen,
      inputId,
      filterId,
      searchQuery,
      setSearchQuery,
    ],
  );

  return (
    <MultiComboboxContext.Provider value={contextValue}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Popover>
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
  HTMLDivElement,
  MultiComboboxInputProps
>(({ className, placeholder }, ref) => {
  const {
    selectedValues,
    onSelect,
    disabled,
    setIsOpen,
    isOpen,
    inputId,
    filterId,
  } = useMultiComboboxContext();

  const handleClick = (): void => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <Popover.Anchor asChild>
      <div
        className={cn(
          inputVariants({
            height: 'flexible',
          }),
          'flex items-center gap-2',
          disabled && 'opacity-50',
          className,
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        ref={ref}
        data-cmdk-input-id={inputId}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {selectedValues.length === 0 && (
            <div className="text-muted-foreground">{placeholder}</div>
          )}
          {selectedValues.length > 0 && (
            <>
              {selectedValues.map((option) => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="flex items-center gap-1 rounded-sm px-1 font-normal"
                >
                  <div>{option.label}</div>
                  <button
                    className="-mr-1 rounded-full p-0.5 hover:bg-secondary-hover"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSelect(option.value, option.label, false);
                        e.stopPropagation();
                      }
                    }}
                    onClick={(e) => {
                      onSelect(option.value, option.label, false);
                      if (isOpen) {
                        document
                          .querySelector<HTMLInputElement>(
                            `[data-cmdk-filter-id="${filterId}"]`,
                          )
                          ?.focus();
                      }
                      e.stopPropagation();
                    }}
                  >
                    <MdClose />
                  </button>
                </Badge>
              ))}
            </>
          )}
        </div>
        <Popover.Trigger>
          <RxCaretSort className="size-4" />
        </Popover.Trigger>
      </div>
    </Popover.Anchor>
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
  const { inputId, filterId, searchQuery, setSearchQuery } =
    useMultiComboboxContext();

  return (
    <Popover.Content
      align="start"
      width="none"
      padding="none"
      sideOffset={0}
      className={cn(selectContentVariants({ popper: 'active' }), className)}
      style={
        {
          '--max-popover-height': maxHeight,
          width: 'var(--radix-popover-trigger-width)',
          ...style,
        } as Record<string, string>
      }
      onInteractOutside={(e) => {
        if (
          e.target &&
          e.target instanceof Element &&
          e.target.closest(`[data-cmdk-input-id="${inputId}"]`)
        ) {
          e.preventDefault();
        }
      }}
      {...rest}
      data-combobox-content=""
    >
      <Command>
        <Command.Input
          data-cmdk-filter-id={filterId}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
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
      onSelect={() => {
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
