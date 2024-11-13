import type { ForwardedRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type {
  AddOptionRequiredFields,
  FieldProps,
  SelectOptionProps,
} from '@src/types/form.js';

import { useControllerMerged } from '@src/hooks/useControllerMerged.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import { FormItem } from '../FormItem/FormItem.js';
import { Select } from '../Select/Select.js';

export interface SelectFieldProps<OptionType>
  extends SelectOptionProps<OptionType>,
    FieldProps {
  className?: string;
}

// we have to use a sentinel value to detect null values since Radix Select doesn't support empty values
// https://github.com/radix-ui/primitives/issues/2706
const NULL_SENTINEL = '__NULL_VALUE__';

const SelectFieldRoot = genericForwardRef(function SelectField<OptionType>(
  {
    label,
    description,
    error,
    value,
    placeholder,
    options,
    renderItemLabel,
    getOptionLabel = (val) => (val as { label: string }).label,
    getOptionValue = (val) => (val as { value: string }).value,
    className,
    onChange,
    ...props
  }: SelectFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
  const selectedOption = options.find((o) => getOptionValue(o) === value);

  const selectedValue = (() => {
    if (!selectedOption || value === undefined) return '';
    return value ?? NULL_SENTINEL;
  })();

  return (
    <FormItem error={error} className={className}>
      {label && <FormItem.Label>{label}</FormItem.Label>}
      <Select
        value={selectedValue}
        onValueChange={(val) => onChange?.(val === NULL_SENTINEL ? null : val)}
        {...props}
      >
        <FormItem.Control>
          <Select.Trigger ref={ref}>
            <Select.Value placeholder={placeholder}>
              {selectedOption ? getOptionLabel(selectedOption) : null}
            </Select.Value>
          </Select.Trigger>
        </FormItem.Control>
        <Select.Content>
          <Select.Group>
            {options.map((option) => {
              const val = getOptionValue(option);
              const label = getOptionLabel(option);
              return (
                <Select.Item value={val ?? NULL_SENTINEL} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, { selected: val === value })
                    : label}
                </Select.Item>
              );
            })}
          </Select.Group>
        </Select.Content>
      </Select>
      {description && (
        <FormItem.Description>{description}</FormItem.Description>
      )}
      {error && <FormItem.Error>{error}</FormItem.Error>}
    </FormItem>
  );
});

interface SelectFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SelectFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type SelectFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = SelectFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

const SelectFieldController = genericForwardRef(function SelectFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    name,
    control,
    ...rest
  }: SelectFieldControllerProps<OptionType, TFieldValues, TFieldName> &
    AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest, ref);

  const restProps = rest as SelectFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return <SelectFieldRoot error={error?.message} {...restProps} {...field} />;
});

export const SelectField = Object.assign(SelectFieldRoot, {
  Controller: SelectFieldController,
});
