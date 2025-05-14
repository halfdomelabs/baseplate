import type { ForwardedRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { notEmpty } from '@halfdomelabs/utils';

import type {
  AddOptionRequiredFields,
  FieldProps,
  MultiSelectOptionProps,
} from '@src/types/form.js';

import { useComponentStrings } from '@src/contexts/component-strings.js';
import { useControllerMerged } from '@src/hooks/useControllerMerged.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem.js';
import { MultiCombobox } from '../MultiCombobox/MultiCombobox.js';

export interface MultiComboboxFieldProps<OptionType>
  extends MultiSelectOptionProps<OptionType>,
    FieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Field with label and error states that wraps a MultiCombobox component.
 */

const MultiComboboxFieldRoot = genericForwardRef(function MultiComboboxField<
  OptionType,
>(
  {
    label,
    description,
    error,
    value,
    placeholder,
    options,
    renderItemLabel,
    onChange,
    getOptionLabel = (val) => (val as { label: string }).label,
    getOptionValue = (val) => (val as { value: string }).value,
    className,
    noResultsText,
    ...props
  }: MultiComboboxFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLDivElement>,
): React.JSX.Element {
  const selectedOptions = value
    ?.map((val) => options.find((option) => getOptionValue(option) === val))
    .filter(notEmpty);
  const selectedValues = selectedOptions?.map((option) => ({
    label: getOptionLabel(option),
    value: getOptionValue(option),
  }));
  const { comboboxNoResults } = useComponentStrings();

  return (
    <FormItem error={error} className={className}>
      <FormLabel>{label}</FormLabel>
      <MultiCombobox
        value={selectedValues}
        onChange={(value) => {
          const newValues = new Set(value.map((val) => val.value));
          onChange?.(
            options.map(getOptionValue).filter((val) => newValues.has(val)),
          );
        }}
        {...props}
      >
        <FormControl>
          <MultiCombobox.Input ref={ref} placeholder={placeholder} />
        </FormControl>
        <MultiCombobox.Content>
          {options.map((option) => {
            const val = getOptionValue(option);
            const label = getOptionLabel(option);
            return (
              <MultiCombobox.Item value={val} key={val} label={label}>
                {renderItemLabel
                  ? renderItemLabel(option, {
                      selected: value?.includes(val) ?? false,
                    })
                  : label}
              </MultiCombobox.Item>
            );
          })}
          <MultiCombobox.Empty>
            {noResultsText ?? comboboxNoResults}
          </MultiCombobox.Empty>
        </MultiCombobox.Content>
      </MultiCombobox>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
});

interface MultiComboboxFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<MultiComboboxFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type MultiComboboxFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = MultiComboboxFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

const MultiComboboxFieldController = genericForwardRef(
  function MultiComboboxFieldController<
    OptionType,
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      name,
      control,
      ...rest
    }: MultiComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
      AddOptionRequiredFields<OptionType>,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    const restProps = rest as MultiComboboxFieldProps<OptionType> &
      AddOptionRequiredFields<OptionType>;

    return (
      <MultiComboboxFieldRoot
        error={error?.message}
        {...restProps}
        {...field}
      />
    );
  },
);

export const MultiComboboxField = Object.assign(MultiComboboxFieldRoot, {
  Controller: MultiComboboxFieldController,
});
