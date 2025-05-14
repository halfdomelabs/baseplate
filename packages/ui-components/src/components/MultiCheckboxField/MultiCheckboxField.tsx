import type { ForwardedRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { notEmpty } from '@halfdomelabs/utils';

import type {
  AddOptionRequiredFields,
  FieldProps,
  MultiSelectOptionProps,
} from '@src/types/form.js';

import { useControllerMerged } from '@src/hooks/useControllerMerged.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import { CheckboxField } from '../CheckboxField/CheckboxField.js';
import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../FormItem/FormItem.js';

export interface MultiCheckboxFieldProps<OptionType>
  extends MultiSelectOptionProps<OptionType>,
    FieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Field with label and error states that wraps multiple CheckboxField components.
 */
const MultiCheckboxFieldRoot = genericForwardRef(function MultiCheckboxField<
  OptionType,
>(
  {
    label,
    description,
    error,
    value,
    options,
    onChange,
    getOptionLabel = (val) => (val as { label: string }).label,
    getOptionValue = (val) => (val as { value: string }).value,
    className,
    disabled,
  }: MultiCheckboxFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLDivElement>,
): React.JSX.Element {
  const selectedOptions = value
    ?.map((val) => options.find((option) => getOptionValue(option) === val))
    .filter(notEmpty);
  const selectedValues = selectedOptions?.map((option) => ({
    label: getOptionLabel(option),
    value: getOptionValue(option),
  }));

  return (
    <FormItem error={error} className={className}>
      <FormLabel>{label}</FormLabel>
      <div className="flex flex-wrap gap-4" ref={ref}>
        {options.map((option) => {
          const optionValue = getOptionValue(option);
          const optionLabel = getOptionLabel(option);
          const checked = selectedValues?.some(
            (selectedValue) => selectedValue.value === optionValue,
          );
          return (
            <CheckboxField
              key={optionValue}
              value={checked}
              label={optionLabel}
              disabled={disabled}
              onChange={(isChecked) => {
                if (isChecked) {
                  onChange?.(
                    options
                      .map(getOptionValue)
                      .filter(
                        (val) =>
                          (val === optionValue || value?.includes(val)) ??
                          false,
                      ),
                  );
                } else {
                  onChange?.(value?.filter((val) => val !== optionValue) ?? []);
                }
              }}
            />
          );
        })}
      </div>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
});

interface MultiCheckboxFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<MultiCheckboxFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type MultiCheckboxFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = MultiCheckboxFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

const MultiCheckboxFieldController = genericForwardRef(
  function MultiCheckboxFieldController<
    OptionType,
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      name,
      control,
      ...rest
    }: MultiCheckboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
      AddOptionRequiredFields<OptionType>,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    const restProps = rest as MultiCheckboxFieldProps<OptionType> &
      AddOptionRequiredFields<OptionType>;

    return (
      <MultiCheckboxFieldRoot
        error={error?.message}
        {...restProps}
        {...field}
      />
    );
  },
);

export const MultiCheckboxField = Object.assign(MultiCheckboxFieldRoot, {
  Controller: MultiCheckboxFieldController,
});
