// @ts-nocheck

'use client';

import type * as React from 'react';

import { cn } from '$cn';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '$inputGroup';
import { Spinner } from '$spinner';
import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import { MdClose, MdUnfoldMore } from 'react-icons/md';

/**
 * An autocomplete input that allows users to filter a list of suggestions
 * while accepting free-form text input.
 *
 * Unlike Combobox, Autocomplete does not enforce selection — the input
 * accepts any value, and suggestions are optional aids.
 *
 * https://base-ui.com/react/components/autocomplete
 */
const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteValue({
  ...props
}: AutocompletePrimitive.Value.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />
  );
}

function AutocompleteTrigger({
  className,
  children,
  ...props
}: AutocompletePrimitive.Trigger.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Trigger
      data-slot="autocomplete-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <MdUnfoldMore className="pointer-events-none size-4 text-muted-foreground" />
    </AutocompletePrimitive.Trigger>
  );
}

function AutocompleteClear({
  className,
  ...props
}: AutocompletePrimitive.Clear.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Clear
      data-slot="autocomplete-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <MdClose className="pointer-events-none" />
    </AutocompletePrimitive.Clear>
  );
}

function AutocompleteInput({
  className,
  children,
  disabled = false,
  showTrigger = false,
  showClear = false,
  showSpinner = false,
  ...props
}: AutocompletePrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
  showSpinner?: boolean;
}): React.ReactElement {
  return (
    <InputGroup className={cn('w-auto', className)}>
      <AutocompletePrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showSpinner ? (
          <div className="flex size-5 items-center justify-center">
            <Spinner className="size-3.5 text-muted-foreground" />
          </div>
        ) : (
          <>
            {showTrigger && (
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                render={<AutocompleteTrigger />}
                data-slot="input-group-button"
                className="group-has-data-[slot=autocomplete-clear]/input-group:hidden data-pressed:bg-transparent"
                disabled={disabled}
              />
            )}
            {showClear && <AutocompleteClear disabled={disabled} />}
            {!showTrigger && !showClear && (
              <div className="size-5" aria-hidden="true" />
            )}
          </>
        )}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function AutocompleteContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<
    AutocompletePrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >): React.ReactElement {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            'group/autocomplete-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0',
            className,
          )}
          {...props}
        />
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  );
}

function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn(
        'max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0',
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteItem({
  className,
  children,
  ...props
}: AutocompletePrimitive.Item.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  );
}

function AutocompleteGroup({
  className,
  ...props
}: AutocompletePrimitive.Group.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Group
      data-slot="autocomplete-group"
      className={cn(className)}
      {...props}
    />
  );
}

function AutocompleteLabel({
  className,
  ...props
}: AutocompletePrimitive.GroupLabel.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="autocomplete-label"
      className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function AutocompleteCollection({
  ...props
}: AutocompletePrimitive.Collection.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Collection
      data-slot="autocomplete-collection"
      {...props}
    />
  );
}

function AutocompleteEmpty({
  className,
  ...props
}: AutocompletePrimitive.Empty.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn(
        'hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/autocomplete-content:flex',
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteStatus({
  className,
  ...props
}: AutocompletePrimitive.Status.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Status
      data-slot="autocomplete-status"
      className={cn(
        'flex items-center justify-center p-2 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteSeparator({
  className,
  ...props
}: AutocompletePrimitive.Separator.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Separator
      data-slot="autocomplete-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

const useAutocompleteFilter = AutocompletePrimitive.useFilter;

export {
  Autocomplete,
  AutocompleteClear,
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  AutocompleteList,
  AutocompleteSeparator,
  AutocompleteStatus,
  AutocompleteTrigger,
  AutocompleteValue,
  useAutocompleteFilter,
};
