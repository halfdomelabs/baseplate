'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';

import type { ComboboxProps } from './combobox';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from './combobox';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from './form-item';

export interface ComboboxFieldProps<OptionType>
  extends Omit<ComboboxProps, 'value' | 'onChange' | 'label' | 'children'>,
    SelectOptionProps<OptionType>,
    FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
}

/**
 * Field with label and error states that wraps a Combobox component.
 */

function ComboboxField<OptionType>({
  label,
  description,
  error,
  value,
  placeholder,
  options,
  renderItemLabel,
  onChange,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string | null }).value,
  className,
  noResultsText,
  ...props
}: ComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const selectedOption = options.find((o) => getOptionValue(o) === value);
  const selectedComboboxOption = (() => {
    if (value === undefined) return;
    if (!selectedOption) return null;
    return {
      label: getOptionLabel(selectedOption),
      value: getOptionValue(selectedOption),
    };
  })();

  return (
    <FormItem error={error} className={className}>
      <FormLabel>{label}</FormLabel>
      <Combobox
        value={selectedComboboxOption}
        onChange={(value) => {
          onChange?.(value.value);
        }}
        {...props}
      >
        <FormControl>
          <ComboboxInput placeholder={placeholder} />
        </FormControl>
        <ComboboxContent>
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
          <ComboboxEmpty>{noResultsText ?? 'No results found'}</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

interface ComboboxFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ComboboxFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type ComboboxFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ComboboxFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

function ComboboxFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: ComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest as ComboboxFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return (
    <ComboboxField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { ComboboxField, ComboboxFieldController };
