/* eslint-disable react/prop-types */
'use client';

import { Command } from '@halfdomelabs/cmdk';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
} from '@radix-ui/react-popover';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
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
import { cn } from '@src/utils';

interface ComboboxContextValue {
  selectedValue: string | undefined | null;
  onSelect: (value: string, label: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setOpen: (open: boolean) => void;
  open: boolean;
  inputId: string;
  selectedLabel: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  children: React.ReactNode;
  value?: ComboboxOption | null;
  onChange?: (value: ComboboxOption | null) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

/**
 * A control that allows users to select an option from a list of options and type to search.
 */

function ComboboxRoot({
  children,
  value: controlledValue,
  onChange,
  searchQuery: defaultSearchQuery,
  onSearchQueryChange,
}: ComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = useControlledState(controlledValue, onChange, null);
  const [searchQuery, setSearchQuery] = useControlledState(
    defaultSearchQuery,
    onSearchQueryChange,
    '',
  );
  // Caches the filter query in a ref so we can maintain
  // the query when animating the combobox open/close
  const [filterQuery, setFilterQuery] = React.useState(searchQuery);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const inputId = React.useId();

  const contextValue: ComboboxContextValue = React.useMemo(
    () => ({
      selectedLabel: value?.label ?? '',
      selectedValue: value?.value,
      onSelect: (val, lab) => {
        setValue({ value: val, label: lab });
        setFilterQuery(searchQuery);
        setSearchQuery('');
        setOpen(false);
      },
      searchQuery,
      setSearchQuery: (query) => {
        setSearchQuery(query);
        setOpen(true);
      },
      setOpen: (open) => {
        setFilterQuery(searchQuery);
        if (!open) {
          setSearchQuery('');
        }
        setOpen(open);
      },
      open,
      inputId,
      inputRef,
    }),
    [value, inputId, searchQuery, setSearchQuery, setValue, open],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={contextValue.setOpen}>
        <Command
          shouldSort={false}
          filterSearch={open ? undefined : filterQuery}
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
      setOpen,
      open,
      inputId,
      searchQuery,
      setSearchQuery,
      selectedLabel,
    } = useComboboxContext();

    const selectedLabelId = React.useId();

    const handleKeydown: React.KeyboardEventHandler<HTMLInputElement> =
      React.useCallback(
        (e) => {
          const specialKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'];
          if (e.key === 'Escape') {
            setOpen(false);
          } else if (specialKeys.includes(e.key)) {
            setOpen(true);
          }
        },
        [setOpen],
      );

    return (
      <PopoverAnchor>
        <div className="relative" data-cmdk-input-id={inputId}>
          <Command.Input
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
            className={cn(inputVariants(), className)}
            placeholder={selectedLabel ? undefined : placeholder}
            onClick={() => setOpen(!open)}
            {...rest}
            aria-describedby={`${rest['aria-describedby']} ${selectedLabelId}`}
            ref={ref}
          />
          <div
            id={selectedLabelId}
            className={cn(
              inputVariants({
                border: 'none',
                background: 'transparent',
              }),
              searchQuery ? 'hidden' : '',
              // the top-[1px] is a hack to prevent the text from jumping when the
              // input is focused
              'pointer-events-none absolute inset-0 top-[1px] overflow-hidden text-ellipsis',
            )}
          >
            {selectedLabel}
          </div>
          <Button
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50"
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${open ? 'Close' : 'Open'} combobox`}
            onClick={() => {
              setOpen(!open);
            }}
            onKeyDown={(e) => {
              if (!open) {
                e.stopPropagation();
              }
            }}
          >
            <RxCaretSort className="h-4 w-4" />
          </Button>
        </div>
      </PopoverAnchor>
    );
  },
);

ComboboxInput.displayName = 'ComboboxInput';

interface ComboboxContentProps {
  children?: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

function ComboboxContent({
  children,
  className,
  maxHeight = '320px',
}: ComboboxContentProps): React.JSX.Element {
  const { inputId } = useComboboxContext();
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
          } as Record<string, string>
        }
        data-combobox-content=""
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
            <Command.List>{children}</Command.List>
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
  value: string;
  label?: string;
}

const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ value, className, label, children, ...rest }, ref) => {
    const { selectedValue, onSelect } = useComboboxContext();

    return (
      <Command.Item
        value={value}
        label={label}
        initiallySelected={value === selectedValue}
        onSelect={(value, label) => {
          onSelect(value, label);
        }}
        className={cn(selectItemVariants(), className)}
        {...rest}
        ref={ref}
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
