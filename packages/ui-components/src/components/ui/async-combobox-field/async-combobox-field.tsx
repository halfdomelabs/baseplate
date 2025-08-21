'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '#src/types/form.js';

import { useComponentStrings } from '#src/contexts/component-strings.js';
import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { useDebounce } from '#src/hooks/use-debounce.js';

import type { ComboboxProps } from '../combobox/combobox.js';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxLoading,
} from '../combobox/combobox.js';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form-item/form-item.js';

type AsyncOptionLoader<OptionType> = (
  searchQuery: string,
) => Promise<OptionType[]>;

export interface AsyncComboboxFieldProps<OptionType>
  extends Omit<
      ComboboxProps,
      | 'value'
      | 'onChange'
      | 'label'
      | 'children'
      | 'searchQuery'
      | 'onSearchQueryChange'
    >,
    Omit<SelectOptionProps<OptionType>, 'options'>,
    FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  loadingText?: React.ReactNode;
  errorText?: React.ReactNode;
  formatError?: (error: unknown) => string;
  loadOptions: AsyncOptionLoader<OptionType>;
  resolveValue?: (value: string | null) => Promise<OptionType | null>;
  debounceMs?: number;
  loadingDelay?: number;
  minSearchLength?: number;
  initialOptions?: OptionType[];
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
  loadingText,
  errorText,
  formatError,
  loadOptions,
  resolveValue,
  debounceMs = 300,
  loadingDelay = 200,
  minSearchLength = 0,
  initialOptions = [],
  ...props
}: AsyncComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const [options, setOptions] = useState<OptionType[]>(initialOptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cache the selected option to persist it across searches
  const [selectedOptionCache, setSelectedOptionCache] =
    useState<OptionType | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  const { comboboxNoResults, comboboxLoading } = useComponentStrings();

  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;
  const initialOptionsRef = useRef(initialOptions);
  initialOptionsRef.current = initialOptions;
  const formatErrorRef = useRef(formatError);
  formatErrorRef.current = formatError;

  // Handle external value changes and try to resolve the option
  useEffect(() => {
    if (value === null || value === undefined) {
      setSelectedOptionCache(null);
      return;
    }

    // Check if we already have this option cached
    if (selectedOptionCache && getOptionValue(selectedOptionCache) === value) {
      return;
    }

    // Try to find the option in current options
    const optionInResults = options.find((o) => getOptionValue(o) === value);
    if (optionInResults) {
      setSelectedOptionCache(optionInResults);
      return;
    }

    // Try to find in initial options
    const optionInInitial = initialOptions.find(
      (o) => getOptionValue(o) === value,
    );
    if (optionInInitial) {
      setSelectedOptionCache(optionInInitial);
      return;
    }

    // If we have a resolveValue function, try to resolve the option
    if (resolveValue) {
      resolveValue(value)
        .then((resolvedOption) => {
          if (resolvedOption && getOptionValue(resolvedOption) === value) {
            setSelectedOptionCache(resolvedOption);
          }
        })
        .catch(() => {
          // If resolution fails, we'll show the value as-is
        });
    }
  }, [
    value,
    options,
    initialOptions,
    selectedOptionCache,
    getOptionValue,
    resolveValue,
  ]);

  useEffect(() => {
    let isAborted = false;

    // Skip loading if search query is shorter than minimum length
    if (debouncedSearchQuery.length < minSearchLength) {
      setOptions(initialOptions);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    // Clear any previous error state
    setLoadError(null);

    // Set up loading timeout to prevent flashing for fast requests
    const loadingTimeout = setTimeout(() => {
      setIsLoading(true);
    }, loadingDelay);

    // Execute the async request
    loadOptionsRef
      .current(debouncedSearchQuery)
      .then((newOptions) => {
        if (!isAborted) {
          setOptions(newOptions);
        }
      })
      .catch((err: unknown) => {
        if (!isAborted) {
          const errorMessage = formatErrorRef.current
            ? formatErrorRef.current(err)
            : err instanceof Error
              ? err.message
              : 'Failed to load options';
          setLoadError(errorMessage);
          setOptions([]);
        }
      })
      .finally(() => {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      });

    // Cleanup function to handle cancellation
    return () => {
      clearTimeout(loadingTimeout);
      isAborted = true;
    };
  }, [debouncedSearchQuery, minSearchLength, loadingDelay, initialOptions]);

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
  }, [value, selectedOptionCache, options, initialOptions, getOptionValue]);

  const selectedComboboxOption = useMemo(() => {
    if (value === undefined) return;

    if (selectedOption) {
      return {
        label: getOptionLabel(selectedOption),
        value: getOptionValue(selectedOption),
      };
    }

    // Fallback: if we have a value but no option, show the value as the label
    if (value !== null) {
      return {
        label: value,
        value,
      };
    }

    return null;
  }, [value, selectedOption, getOptionLabel, getOptionValue]);

  const handleSearchQueryChange = (query: string): void => {
    setSearchQuery(query);
  };

  const renderContent = (): React.ReactElement => {
    if (isLoading) {
      return (
        <ComboboxLoading>{loadingText ?? comboboxLoading}</ComboboxLoading>
      );
    }

    if (loadError) {
      return (
        <div role="alert" className="p-4 text-sm text-destructive">
          {errorText ?? loadError}
        </div>
      );
    }

    return (
      <>
        {options.map((option) => {
          const val = getOptionValue(option);
          const label = getOptionLabel(option);
          return (
            <ComboboxItem value={val} key={val} label={label}>
              {renderItemLabel
                ? renderItemLabel(option, { selected: val === value })
                : label}
            </ComboboxItem>
          );
        })}
        <ComboboxEmpty>{noResultsText ?? comboboxNoResults}</ComboboxEmpty>
      </>
    );
  };

  return (
    <FormItem error={error} className={className}>
      <FormLabel>{label}</FormLabel>
      <Combobox
        value={selectedComboboxOption}
        onChange={(comboboxValue) => {
          const selectedValue = comboboxValue.value;

          // Find the full option object that was selected and cache it
          const fullOption = options.find(
            (o) => getOptionValue(o) === selectedValue,
          );
          if (fullOption) {
            setSelectedOptionCache(fullOption);
          }

          onChange?.(selectedValue);
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        {...props}
      >
        <FormControl>
          <ComboboxInput placeholder={placeholder} />
        </FormControl>
        <ComboboxContent>{renderContent()}</ComboboxContent>
      </Combobox>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
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
