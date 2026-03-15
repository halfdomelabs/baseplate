'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '#src/types/form.js';

import { useComponentStrings } from '#src/contexts/component-strings.js';
import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { useEventCallback } from '#src/hooks/use-event-callback.js';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from '../combobox/combobox.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';

type AsyncOptionLoader<OptionType> = (
  searchQuery: string,
) => Promise<OptionType[]>;

export interface AsyncComboboxFieldProps<OptionType>
  extends Omit<SelectOptionProps<OptionType>, 'options'>, FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  typeToSearchText?: React.ReactNode;
  loadingText?: React.ReactNode;
  errorText?: React.ReactNode;
  formatError?: (error: unknown) => string;
  loadOptions: AsyncOptionLoader<OptionType>;
  debounceMs?: number;
  minSearchLength?: number;
  initialOptions?: OptionType[];
  placeholder?: string;
  disabled?: boolean;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

interface SearchState<OptionType> {
  options: OptionType[];
  isLoading: boolean;
  loadError: string | null;
  hasSearched: boolean;
}

type SearchAction<OptionType> =
  | { type: 'reset'; initialOptions: OptionType[] }
  | { type: 'searchStarted' }
  | { type: 'searchSucceeded'; options: OptionType[] }
  | { type: 'searchFailed'; error: string }
  | { type: 'cleared'; initialOptions: OptionType[] };

function searchReducer<OptionType>(
  state: SearchState<OptionType>,
  action: SearchAction<OptionType>,
): SearchState<OptionType> {
  switch (action.type) {
    case 'reset': {
      return {
        options: action.initialOptions,
        isLoading: false,
        loadError: null,
        hasSearched: false,
      };
    }
    case 'searchStarted': {
      return { ...state, isLoading: true, loadError: null, hasSearched: true };
    }
    case 'searchSucceeded': {
      return { ...state, options: action.options, isLoading: false };
    }
    case 'searchFailed': {
      return {
        ...state,
        options: [],
        isLoading: false,
        loadError: action.error,
      };
    }
    case 'cleared': {
      return {
        options: action.initialOptions,
        isLoading: false,
        loadError: null,
        hasSearched: false,
      };
    }
  }
}

/**
 * Field with label and error states that wraps a Combobox component with async option loading.
 */
function AsyncComboboxField<OptionType>({
  label,
  description,
  error,
  value,
  placeholder,
  renderItemLabel,
  onChange,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string | null }).value,
  className,
  noResultsText,
  typeToSearchText,
  loadingText,
  errorText,
  formatError,
  loadOptions,
  debounceMs = 300,
  minSearchLength = 0,
  initialOptions = [],
  disabled,
}: AsyncComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const [{ options, isLoading, loadError, hasSearched }, dispatch] = useReducer(
    searchReducer<OptionType>,
    {
      options: initialOptions,
      isLoading: false,
      loadError: null,
      hasSearched: false,
    },
  );

  // Cache the selected option to persist it across searches
  const [selectedOptionCache, setSelectedOptionCache] =
    useState<OptionType | null>(null);

  const { comboboxNoResults, comboboxTypeToSearch, comboboxLoading } =
    useComponentStrings();

  const id = useId();

  // Stable callbacks that always reference the latest closure
  const stableLoadOptions = useEventCallback(loadOptions);
  const stableFormatError = useEventCallback(formatError);
  const stableGetOptionValue = useEventCallback(getOptionValue);
  const initialOptionsRef = useRef(initialOptions);
  initialOptionsRef.current = initialOptions;

  // Refs for cancellation
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      searchAbortRef.current?.abort();
    },
    [],
  );

  // Handle external value changes and try to resolve the option
  useEffect(() => {
    if (value === null || value === undefined) {
      setSelectedOptionCache(null);
      return;
    }

    // Check if already cached
    if (
      selectedOptionCache &&
      stableGetOptionValue(selectedOptionCache) === value
    ) {
      return;
    }

    // Try to find in current options or initial options
    const found =
      options.find((o) => stableGetOptionValue(o) === value) ??
      initialOptionsRef.current.find((o) => stableGetOptionValue(o) === value);

    if (found) {
      setSelectedOptionCache(found);
    }
  }, [value, options, stableGetOptionValue, selectedOptionCache]);

  const selectedOption = useMemo(() => {
    if (value === null || value === undefined) return null;

    // First priority: option from cache (persists across searches)
    if (selectedOptionCache && getOptionValue(selectedOptionCache) === value) {
      return selectedOptionCache;
    }

    // Second priority: option from current search results
    const optionInResults = options.find((o) => getOptionValue(o) === value);
    if (optionInResults) {
      return optionInResults;
    }

    // Third priority: option from initial options
    const optionInInitial = initialOptions.find(
      (o) => getOptionValue(o) === value,
    );
    if (optionInInitial) {
      return optionInInitial;
    }

    return null;
  }, [value, options, initialOptions, getOptionValue, selectedOptionCache]);

  const handleInputValueChange = useEventCallback(
    (inputValue: string, eventDetails: { reason: string }) => {
      // Don't re-fetch when user selects an item
      if (eventDetails.reason === 'item-press') {
        return;
      }

      // Clear previous debounce timer and abort previous request
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      searchAbortRef.current?.abort();

      // Clear input: clear selection and reset to initial options
      if (inputValue === '') {
        onChange?.(null);
        setSelectedOptionCache(null);
        dispatch({
          type: 'cleared',
          initialOptions: initialOptionsRef.current,
        });
        return;
      }

      // Below min search length: reset to initial options
      if (inputValue.trim().length < minSearchLength) {
        dispatch({ type: 'reset', initialOptions: initialOptionsRef.current });
        return;
      }

      // Debounce the actual fetch
      debounceTimerRef.current = setTimeout(() => {
        const controller = new AbortController();
        searchAbortRef.current = controller;

        dispatch({ type: 'searchStarted' });

        stableLoadOptions(inputValue)
          .then((newOptions) => {
            if (!controller.signal.aborted) {
              dispatch({ type: 'searchSucceeded', options: newOptions });
            }
          })
          .catch((err: unknown) => {
            if (!controller.signal.aborted) {
              const errorMessage = stableFormatError
                ? stableFormatError(err)
                : err instanceof Error
                  ? err.message
                  : 'Failed to load options';
              dispatch({ type: 'searchFailed', error: errorMessage });
            }
          });
      }, debounceMs);
    },
  );

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        value={selectedOption}
        onValueChange={(option) => {
          if (option) {
            setSelectedOptionCache(option);
          }
          onChange?.(option ? getOptionValue(option) : null);
        }}
        onInputValueChange={handleInputValueChange}
        onOpenChangeComplete={(open) => {
          if (!open) {
            dispatch({
              type: 'reset',
              initialOptions: initialOptionsRef.current,
            });
          }
        }}
        disabled={disabled}
        items={options}
        itemToStringLabel={(option: OptionType) => getOptionLabel(option)}
        itemToStringValue={(option: OptionType) => getOptionValue(option) ?? ''}
        filter={null}
      >
        <ComboboxInput id={id} placeholder={placeholder} />
        <ComboboxContent>
          {isLoading ? (
            <ComboboxStatus className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              {loadingText ?? comboboxLoading}
            </ComboboxStatus>
          ) : loadError ? (
            <ComboboxStatus
              role="alert"
              className="p-4 text-sm text-destructive"
            >
              {errorText ?? loadError}
            </ComboboxStatus>
          ) : null}
          {!isLoading && !loadError && (
            <ComboboxEmpty className="p-4 text-sm text-muted-foreground">
              {hasSearched
                ? (noResultsText ?? comboboxNoResults)
                : (typeToSearchText ?? comboboxTypeToSearch)}
            </ComboboxEmpty>
          )}
          {!isLoading && !loadError && (
            <ComboboxList>
              {(option: OptionType) => {
                const val = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                return (
                  <ComboboxItem value={option} key={val}>
                    {renderItemLabel
                      ? renderItemLabel(option, { selected: val === value })
                      : optionLabel}
                  </ComboboxItem>
                );
              }}
            </ComboboxList>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

interface AsyncComboboxFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<AsyncComboboxFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type AsyncComboboxFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = AsyncComboboxFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

function AsyncComboboxFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: AsyncComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest as AsyncComboboxFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return (
    <AsyncComboboxField
      error={error?.message ?? undefined}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { AsyncComboboxField, AsyncComboboxFieldController };
