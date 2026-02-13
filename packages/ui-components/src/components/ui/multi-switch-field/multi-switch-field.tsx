import type { ForwardedRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { notEmpty } from '@baseplate-dev/utils';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  MultiSelectOptionProps,
} from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { cn } from '#src/utils/cn.js';
import { genericForwardRef } from '#src/utils/generic-forward-ref.js';

import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form-item/form-item.js';
import { SwitchField } from '../switch-field/switch-field.js';

export interface MultiSwitchFieldProps<OptionType>
  extends MultiSelectOptionProps<OptionType>, FormFieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Field with label and error states that wraps multiple SwitchField components.
 */
const MultiSwitchFieldRoot = genericForwardRef(function MultiSwitchField<
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
  }: MultiSwitchFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
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
    <FormItem error={error} className={cn('space-y-3', className)}>
      <FormLabel>{label}</FormLabel>
      <div className="flex flex-wrap gap-4" ref={ref}>
        {options.map((option) => {
          const optionValue = getOptionValue(option);
          const optionLabel = getOptionLabel(option);
          const checked = selectedValues?.some(
            (selectedValue) => selectedValue.value === optionValue,
          );
          return (
            <SwitchField
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

interface MultiSwitchFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<MultiSwitchFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type MultiSwitchFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = MultiSwitchFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

const MultiSwitchFieldController = genericForwardRef(
  function MultiSwitchFieldController<
    OptionType,
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      name,
      control,
      ...rest
    }: MultiSwitchFieldControllerProps<OptionType, TFieldValues, TFieldName> &
      AddOptionRequiredFields<OptionType>,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    const restProps = rest as MultiSwitchFieldProps<OptionType> &
      AddOptionRequiredFields<OptionType>;

    return (
      <MultiSwitchFieldRoot error={error?.message} {...restProps} {...field} />
    );
  },
);

export const MultiSwitchField = Object.assign(MultiSwitchFieldRoot, {
  Controller: MultiSwitchFieldController,
});
