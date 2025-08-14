// @ts-nocheck

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  MultiSelectOptionProps,
} from '$typesForm';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '$formItem';
import { useControllerMerged } from '$hooksUseControllerMerged';
import {
  MultiCombobox,
  MultiComboboxContent,
  MultiComboboxEmpty,
  MultiComboboxInput,
  MultiComboboxItem,
} from '$multiCombobox';

export interface MultiComboboxFieldProps<OptionType>
  extends MultiSelectOptionProps<OptionType>,
    FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Field with label and error states that wraps a MultiCombobox component.
 */
function MultiComboboxField<OptionType>({
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
}: MultiComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const selectedOptions = value
    ?.map((val) => options.find((option) => getOptionValue(option) === val))
    .filter((x) => x !== undefined);
  const selectedValues = selectedOptions?.map((option) => ({
    label: getOptionLabel(option),
    value: getOptionValue(option),
  }));

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
          <MultiComboboxInput placeholder={placeholder} />
        </FormControl>
        <MultiComboboxContent>
          {options.map((option) => {
            const val = getOptionValue(option);
            const label = getOptionLabel(option);
            return (
              <MultiComboboxItem value={val} key={val} label={label}>
                {renderItemLabel
                  ? renderItemLabel(option, {
                      selected: value?.includes(val) ?? false,
                    })
                  : label}
              </MultiComboboxItem>
            );
          })}
          <MultiComboboxEmpty>
            {noResultsText ?? 'No results found'}
          </MultiComboboxEmpty>
        </MultiComboboxContent>
      </MultiCombobox>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

interface MultiComboboxFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<MultiComboboxFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function MultiComboboxFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: MultiComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest as MultiComboboxFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return (
    <MultiComboboxField error={error?.message} {...restProps} {...field} />
  );
}

export { MultiComboboxField, MultiComboboxFieldController };
