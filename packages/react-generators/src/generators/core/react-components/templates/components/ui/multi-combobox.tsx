// @ts-nocheck

'use client';

import { Badge } from '$badge';
import { cn } from '$cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '$command';
import { useControlledState } from '$hooksUseControlledState';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '$popover';
import { inputVariants } from '$stylesInput';
import { selectContentVariants, selectItemVariants } from '$stylesSelect';
import React, { useId, useMemo, useState } from 'react';
import { MdCheck, MdClose, MdUnfoldMore } from 'react-icons/md';

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

function MultiCombobox({
  children,
  value,
  onChange,
  disabled,
}: MultiComboboxProps): React.ReactElement {
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

function MultiComboboxInput({
  className,
  placeholder,
}: MultiComboboxInputProps): React.ReactElement {
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
    <PopoverAnchor asChild>
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
                  className="flex items-center gap-1 rounded-xs px-1 font-normal"
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
        <PopoverTrigger>
          <MdUnfoldMore className="size-4" />
        </PopoverTrigger>
      </div>
    </PopoverAnchor>
  );
}

interface MultiComboboxContentProps extends React.ComponentPropsWithRef<'div'> {
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
}: MultiComboboxContentProps): React.ReactElement {
  const { inputId, filterId, searchQuery, setSearchQuery } =
    useMultiComboboxContext();

  return (
    <PopoverContent
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
        <CommandInput
          data-cmdk-filter-id={filterId}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>{children}</CommandList>
      </Command>
    </PopoverContent>
  );
}

function MultiComboboxEmpty({
  className,
  ...props
}: React.ComponentPropsWithRef<'div'>): React.ReactElement {
  return <CommandEmpty className={cn('p-2 text-sm', className)} {...props} />;
}

const MultiComboboxGroup = CommandGroup;

interface MultiComboboxItemProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'onSelect'
> {
  disabled?: boolean;
  value: string;
  label?: string;
}

function MultiComboboxItem({
  value,
  className,
  label,
  children,
  ...rest
}: MultiComboboxItemProps): React.ReactElement {
  const { selectedValues, onSelect } = useMultiComboboxContext();
  const isSelected = selectedValues.some((v) => v.value === value);
  const itemRef = React.useRef<HTMLDivElement>(null);

  return (
    <CommandItem
      onSelect={() => {
        const itemLabel = label ?? itemRef.current?.textContent ?? undefined;
        onSelect(value, itemLabel, !isSelected);
      }}
      className={cn(selectItemVariants(), className)}
      {...rest}
      ref={itemRef}
    >
      <div
        className={cn(
          'mr-2 flex h-4 w-4 items-center justify-center rounded-xs border',
          isSelected ? 'opacity-100' : '[&_svg]:invisible',
        )}
      >
        <MdCheck className={'size-4'} />
      </div>
      {children}
    </CommandItem>
  );
}

export {
  MultiCombobox,
  MultiComboboxContent,
  MultiComboboxEmpty,
  MultiComboboxGroup,
  MultiComboboxInput,
  MultiComboboxItem,
};
