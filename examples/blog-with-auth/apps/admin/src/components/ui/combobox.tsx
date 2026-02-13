'use client';

import { Command } from 'cmdk';
import { Popover, ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import * as React from 'react';
import { MdCheck, MdUnfoldMore } from 'react-icons/md';

import { useControlledState } from '@src/hooks/use-controlled-state';
import { inputVariants } from '@src/styles/input';
import {
  selectCheckVariants,
  selectContentVariants,
  selectItemVariants,
} from '@src/styles/select';
import { cn } from '@src/utils/cn';
import { mergeRefs } from '@src/utils/merge-refs';

import { Button } from './button';
import { ScrollBar } from './scroll-area';

interface ComboboxContextValue {
  selectedValue: string | undefined | null;
  selectedLabel: string | undefined | null;
  onSelect: (value: string | null, label: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  inputId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  shouldShowItem: (label: string | null) => boolean;
  disabled: boolean;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

interface ComboboxOption {
  label?: string;
  value: string | null;
}

export interface ComboboxProps {
  children: React.ReactNode;
  value?: ComboboxOption | null;
  onChange?: (value: ComboboxOption) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  label?: string;
  disabled?: boolean;
}

const DEFAULT_OPTION = { value: null, label: '' };

/**
 * A control that allows users to select an option from a list of options and type to search.
 */
function Combobox({
  children,
  value: controlledValue,
  onChange,
  searchQuery: defaultSearchQuery,
  onSearchQueryChange,
  label,
  disabled = false,
}: ComboboxProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [value, setValue] = useControlledState(
    controlledValue === null ? DEFAULT_OPTION : controlledValue,
    onChange,
    DEFAULT_OPTION,
  );
  const [searchQuery, setSearchQuery] = useControlledState(
    defaultSearchQuery,
    onSearchQueryChange,
    '',
  );
  // the value of the combobox that is currently active
  const [activeValue, setActiveValue] = React.useState<string | undefined>(
    value.value ?? '',
  );
  // Caches the filter query so we can maintain
  // the query when animating the combobox open/close
  const [filterQuery, setFilterQuery] = React.useState(searchQuery);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const inputId = React.useId();

  const listRef = React.useRef<HTMLDivElement>(null);

  const contextValue: ComboboxContextValue = React.useMemo(
    () => ({
      selectedLabel: value.label ?? '',
      selectedValue: value.value,
      onSelect: (val, lab) => {
        setValue({ value: val, label: lab });
        setFilterQuery(searchQuery);
        setSearchQuery('');
        setIsOpen(false);
      },
      searchQuery,
      setSearchQuery: (query) => {
        setFilterQuery(query);
        setSearchQuery(query);
        setIsOpen(true);
      },
      setIsOpen: (open) => {
        setFilterQuery(searchQuery);
        if (!open) {
          setActiveValue(value.value ?? '');
          setSearchQuery('');
        }
        setIsOpen(open);
      },
      isOpen,
      inputId,
      inputRef,
      listRef,
      shouldShowItem: (label) => {
        if (!filterQuery) {
          return true;
        }
        if (!label) {
          return false;
        }
        return label.toLowerCase().includes(filterQuery.toLowerCase());
      },
      disabled,
    }),
    [
      value,
      inputId,
      searchQuery,
      setSearchQuery,
      setValue,
      isOpen,
      filterQuery,
      disabled,
    ],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Popover.Root open={isOpen} onOpenChange={contextValue.setIsOpen}>
        <Command
          aria-disabled={disabled}
          shouldFilter={false}
          value={activeValue}
          onValueChange={(val) => {
            setActiveValue(val);
          }}
          label={label}
        >
          {children}
        </Command>
      </Popover.Root>
    </ComboboxContext.Provider>
  );
}

export function useComboboxContext(): ComboboxContextValue {
  const value = React.useContext(ComboboxContext);

  if (!value) {
    throw new Error(
      `useComboboxContext must be used inside a ComboboxContext provider`,
    );
  }

  return value;
}

interface ComboboxInputProps extends Omit<
  React.ComponentPropsWithRef<'input'>,
  'value'
> {
  selectedLabel?: string;
}

function ComboboxInput({
  className,
  placeholder,
  ref,
  ...rest
}: ComboboxInputProps): React.ReactElement {
  const {
    setIsOpen,
    isOpen,
    inputId,
    searchQuery,
    setSearchQuery,
    selectedLabel,
    disabled,
  } = useComboboxContext();

  const selectedLabelId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeydown: React.KeyboardEventHandler<HTMLInputElement> =
    React.useCallback(
      (e) => {
        const specialKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'];
        if (e.key === 'Escape') {
          setIsOpen(false);
        } else if (specialKeys.includes(e.key)) {
          setIsOpen(true);
        }
      },
      [setIsOpen],
    );

  return (
    <Popover.Anchor>
      <div className="relative" data-cmdk-input-id={inputId}>
        <Command.Input
          asChild
          onKeyDown={handleKeydown}
          disabled={disabled}
          onBlur={(e) => {
            if (
              e.relatedTarget &&
              e.relatedTarget instanceof Element &&
              e.relatedTarget.closest(`[data-combobox-content=""]`)
            ) {
              e.target.focus();
            }
          }}
          value={searchQuery}
          onValueChange={setSearchQuery}
          className={cn(inputVariants(), 'pr-8', className)}
          placeholder={selectedLabel ? undefined : placeholder}
          onClick={() => {
            if (disabled) {
              return;
            }
            if (!isOpen) {
              setIsOpen(true);
            } else if (inputRef.current) {
              // avoid closing the combobox if the user is selecting text
              const hasSelectedEnd =
                inputRef.current.selectionStart ===
                  inputRef.current.selectionEnd &&
                inputRef.current.selectionEnd === inputRef.current.value.length;
              if (hasSelectedEnd) {
                setIsOpen(false);
              }
            }
          }}
          {...rest}
          aria-describedby={`${rest['aria-describedby'] ?? ''} ${selectedLabelId}`}
          ref={mergeRefs(ref, inputRef)}
        >
          <input
            // allow aria-labelledby to be overridden
            {...(rest['aria-labelledby']
              ? { 'aria-labelledby': rest['aria-labelledby'] }
              : undefined)}
          />
        </Command.Input>
        <div className="pointer-events-none absolute inset-0 flex items-center pr-8">
          <div
            id={selectedLabelId}
            className={cn(
              disabled ? 'opacity-50' : '',
              searchQuery ? 'hidden' : '',
              'pointer-events-none truncate py-1 pl-3 text-base md:text-sm',
            )}
          >
            {selectedLabel}
          </div>
        </div>
        <Button
          className="absolute top-1/2 right-2 -translate-y-1/2 opacity-50"
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`${isOpen ? 'Close' : 'Open'} combobox`}
          onClick={() => {
            if (disabled) {
              return;
            }
            setIsOpen(!isOpen);
          }}
          onKeyDown={(e) => {
            if (!isOpen) {
              e.stopPropagation();
            }
          }}
        >
          <MdUnfoldMore className="size-4" />
        </Button>
      </div>
    </Popover.Anchor>
  );
}

interface ComboboxContentProps extends React.RefAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  style?: React.CSSProperties;
}

function ComboboxContent({
  children,
  className,
  maxHeight = '320px',
  style,
  ...rest
}: ComboboxContentProps): React.JSX.Element {
  const { inputId, listRef } = useComboboxContext();
  return (
    <Popover.Portal>
      <Popover.Content
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (
            e.target &&
            e.target instanceof Element &&
            e.target.closest(`[data-cmdk-input-id="${inputId}"]`)
          ) {
            e.preventDefault();
          }
        }}
        className={cn(selectContentVariants({ popper: 'active' }), className)}
        style={
          {
            '--max-popover-height': maxHeight,
            ...style,
          } as Record<string, string>
        }
        data-combobox-content=""
        {...rest}
      >
        <ScrollAreaPrimitive.Root
          type="auto"
          className="relative overflow-hidden"
        >
          <ScrollAreaPrimitive.Viewport
            className={cn(
              'h-full w-full rounded-[inherit] p-1',
              'max-h-[min(var(--max-popover-height),var(--radix-popover-content-available-height))] w-full min-w-(--radix-popover-trigger-width)',
            )}
            style={
              {
                '--max-popper-height': maxHeight,
              } as Record<string, string>
            }
          >
            <Command.List ref={listRef}>{children}</Command.List>
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </Popover.Content>
    </Popover.Portal>
  );
}

type ComboboxEmptyProps = React.HTMLAttributes<HTMLDivElement>;

function ComboboxEmpty({
  className,
  ...props
}: ComboboxEmptyProps): React.ReactElement {
  return <Command.Empty className={cn('p-2 text-sm', className)} {...props} />;
}

const ComboboxGroup = Command.Group;

interface ComboboxItemProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'onSelect'
> {
  disabled?: boolean;
  value: string | null;
  label?: string;
}

function ComboboxItem({
  value,
  className,
  label,
  children,
  ref,
  ...rest
}: ComboboxItemProps): React.ReactElement {
  const { selectedValue, onSelect, shouldShowItem } = useComboboxContext();
  const itemRef = React.useRef<HTMLDivElement>(null);

  const extractedLabel =
    label ?? (typeof children === 'string' ? children.trim() : undefined);

  if (!shouldShowItem(extractedLabel ?? value)) {
    return <></>;
  }

  return (
    <Command.Item
      value={value ?? ''}
      onSelect={() => {
        onSelect(value, extractedLabel);
      }}
      className={cn(selectItemVariants(), className)}
      {...rest}
      ref={mergeRefs(ref, itemRef)}
    >
      {children}
      <MdCheck
        className={cn(
          selectCheckVariants(),
          value === selectedValue ? 'opacity-100' : 'opacity-0',
        )}
      />
    </Command.Item>
  );
}

interface ComboboxActionProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'onSelect' | 'onClick'
> {
  disabled?: boolean;
  value: string;
  label?: string;
  onClick?: () => void;
}

function ComboboxAction({
  value,
  className,
  children,
  onClick,
  ref,
  ...rest
}: ComboboxActionProps): React.ReactElement {
  const itemRef = React.useRef<HTMLDivElement>(null);

  return (
    <Command.Item
      value={value}
      onSelect={onClick}
      className={cn(selectItemVariants(), className)}
      {...rest}
      ref={mergeRefs(ref, itemRef)}
    >
      {children}
    </Command.Item>
  );
}

export {
  Combobox,
  ComboboxAction,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
};
