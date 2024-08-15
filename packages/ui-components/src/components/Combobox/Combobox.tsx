/* eslint-disable react/prop-types */
'use client';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
} from '@radix-ui/react-popover';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Command } from 'cmdk';
import * as React from 'react';
import { MdCheck } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';

import { Button } from '../Button/Button';
import { ScrollArea } from '../ScrollArea/ScrollArea';
import { useControlledState } from '@src/hooks/useControlledState';
import {
  inputVariants,
  selectCheckVariants,
  selectContentVariants,
  selectItemVariants,
} from '@src/styles';
import { cn, mergeRefs } from '@src/utils';

interface ComboboxContextValue {
  selectedValue: string | undefined | null;
  selectedLabel: string | undefined | null;
  onSelect: (value: string | null, label: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  inputId: string;
  activeDescendentId: string | undefined;
  listRef: React.RefObject<HTMLDivElement>;
  shouldShowItem: (label: string | null) => boolean;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

interface ComboboxOption {
  label?: string;
  value: string | null;
}

interface ComboboxProps {
  children: React.ReactNode;
  value?: ComboboxOption | null;
  onChange?: (value: ComboboxOption) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  label?: string;
}

/**
 * A control that allows users to select an option from a list of options and type to search.
 */

const DEFAULT_OPTION = { value: null, label: '' };

function ComboboxRoot({
  children,
  value: controlledValue,
  onChange,
  searchQuery: defaultSearchQuery,
  onSearchQueryChange,
  label,
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
    value?.value ?? '',
  );
  // Caches the filter query so we can maintain
  // the query when animating the combobox open/close
  const [filterQuery, setFilterQuery] = React.useState(searchQuery);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const inputId = React.useId();

  const listRef = React.useRef<HTMLDivElement>(null);

  const [activeDescendentId, setActiveDescendentId] = React.useState<
    string | undefined
  >();

  // workaround for https://github.com/pacocoursey/cmdk/issues/253
  function fixActiveDescendant(newActiveValue: string | undefined): void {
    if (!newActiveValue) return;
    const item = listRef.current?.querySelector(
      `[cmdk-item=""][data-value="${encodeURIComponent(newActiveValue)}"]`,
    );
    setActiveDescendentId(item?.id);
  }

  const contextValue: ComboboxContextValue = React.useMemo(
    () => ({
      selectedLabel: value?.label ?? '',
      selectedValue: value?.value,
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
          setActiveValue(value?.value ?? '');
          setSearchQuery('');
        }
        setIsOpen(open);
      },
      isOpen,
      inputId,
      inputRef,
      listRef,
      activeDescendentId,
      shouldShowItem: (label) => {
        if (!filterQuery) {
          return true;
        }
        if (!label) {
          return false;
        }
        return label.toLowerCase().includes(filterQuery.toLowerCase());
      },
    }),
    [
      value,
      inputId,
      searchQuery,
      setSearchQuery,
      setValue,
      isOpen,
      filterQuery,
      activeDescendentId,
    ],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Popover open={isOpen} onOpenChange={contextValue.setIsOpen}>
        <Command
          shouldFilter={false}
          value={activeValue}
          onValueChange={(val) => {
            setActiveValue(val);
            fixActiveDescendant(val);
          }}
          label={label}
        >
          {children}
        </Command>
      </Popover>
    </ComboboxContext.Provider>
  );
}

ComboboxRoot.displayName = 'ComboboxRoot';

export function useComboboxContext(): ComboboxContextValue {
  const value = React.useContext(ComboboxContext);

  if (!value) {
    throw new Error(
      `useComboboxContext must be used inside a ComboboxContext provider`,
    );
  }

  return value;
}

interface ComboboxInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  selectedLabel?: string;
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ className, placeholder, ...rest }: ComboboxInputProps, ref) => {
    const {
      setIsOpen,
      isOpen,
      inputId,
      searchQuery,
      setSearchQuery,
      selectedLabel,
      activeDescendentId,
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
            // if we pass through the event, the Command component will error out if the portal is not open
            if (!isOpen) {
              e.preventDefault();
            }
          }
        },
        [setIsOpen, isOpen],
      );

    return (
      <PopoverAnchor>
        <div className="relative" data-cmdk-input-id={inputId}>
          <Command.Input
            asChild
            onKeyDown={handleKeydown}
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
            className={cn(
              inputVariants({ rightPadding: 'none' }),
              'pr-8',
              className,
            )}
            placeholder={selectedLabel ? undefined : placeholder}
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
              } else if (inputRef.current) {
                // avoid closing the combobox if the user is selecting text
                const hasSelectedEnd =
                  inputRef.current.selectionStart ===
                    inputRef.current.selectionEnd &&
                  inputRef.current.selectionEnd ===
                    inputRef.current.value.length;
                if (hasSelectedEnd) {
                  setIsOpen(false);
                }
              }
            }}
            {...rest}
            aria-describedby={`${rest['aria-describedby'] ?? ''} ${selectedLabelId}`}
            ref={mergeRefs([ref, inputRef])}
          >
            <input
              aria-activedescendant={activeDescendentId}
              // allow aria-labelledby to be overridden
              {...(rest['aria-labelledby']
                ? { 'aria-labelledby': rest['aria-labelledby'] }
                : undefined)}
            />
          </Command.Input>
          <div
            // the top-[1px] is a hack to prevent the text from jumping when the
            // input is focused
            className="pointer-events-none absolute inset-0 top-px pr-8"
          >
            <div
              id={selectedLabelId}
              className={cn(
                inputVariants({
                  border: 'none',
                  background: 'transparent',
                }),
                searchQuery ? 'hidden' : '',
                'pointer-events-none truncate',
              )}
            >
              {selectedLabel}
            </div>
          </div>
          <Button
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50"
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${isOpen ? 'Close' : 'Open'} combobox`}
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            onKeyDown={(e) => {
              if (!isOpen) {
                e.stopPropagation();
              }
            }}
          >
            <RxCaretSort className="size-4" />
          </Button>
        </div>
      </PopoverAnchor>
    );
  },
);

ComboboxInput.displayName = 'ComboboxInput';

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
    <PopoverPortal>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
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
              'max-h-[min(var(--max-popover-height),var(--radix-popover-content-available-height))] w-full min-w-[var(--radix-popover-trigger-width)]',
            )}
            style={
              {
                '--max-popper-height': maxHeight,
              } as Record<string, string>
            }
          >
            <Command.List ref={listRef}>{children}</Command.List>
          </ScrollAreaPrimitive.Viewport>
          <ScrollArea.ScrollBar />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </PopoverContent>
    </PopoverPortal>
  );
}

type ComboboxEmptyProps = React.HTMLAttributes<HTMLDivElement>;

const ComboboxEmpty = React.forwardRef<HTMLDivElement, ComboboxEmptyProps>(
  ({ className, ...props }: ComboboxEmptyProps, ref) => (
    <Command.Empty
      className={cn('p-2 text-sm', className)}
      {...props}
      ref={ref}
    />
  ),
);

ComboboxEmpty.displayName = 'ComboboxEmpty';

const ComboboxGroup = Command.Group;

interface ComboboxItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  disabled?: boolean;
  value: string | null;
  label?: string;
}

const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ value, className, label, children, ...rest }, ref) => {
    const { selectedValue, onSelect, shouldShowItem } = useComboboxContext();
    const itemRef = React.useRef<HTMLDivElement>(null);

    const extractedLabel =
      label ?? (typeof children === 'string' ? children.trim() : undefined);

    if (!shouldShowItem(extractedLabel ?? value)) {
      return null;
    }

    return (
      <Command.Item
        value={value ?? ''}
        onSelect={() => {
          onSelect(value, extractedLabel);
        }}
        className={cn(selectItemVariants(), className)}
        {...rest}
        ref={mergeRefs([ref, itemRef])}
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
  },
);

ComboboxItem.displayName = 'ComboboxItem';

export const Combobox = Object.assign(ComboboxRoot, {
  Input: ComboboxInput,
  Content: ComboboxContent,
  Empty: ComboboxEmpty,
  Group: ComboboxGroup,
  Item: ComboboxItem,
});
