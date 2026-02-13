// @ts-nocheck

'use client';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '$typesForm';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$select';

export interface SelectFieldProps<OptionType>
  extends SelectOptionProps<OptionType>, FormFieldProps {
  className?: string;
}

// we have to use a sentinel value to detect null values since Radix Select doesn't support empty values
// https://github.com/radix-ui/primitives/issues/2706
const NULL_SENTINEL = '__NULL_VALUE__';

function SelectField<OptionType>({
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
}: SelectFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const selectedOption = options.find((o) => getOptionValue(o) === value);

  const selectedValue = (() => {
    if (!selectedOption || value === undefined) return '';
    return value ?? NULL_SENTINEL;
  })();

  return (
    <FormItem error={error} className={className}>
      <FormLabel>{label}</FormLabel>
      <Select
        value={selectedValue}
        onValueChange={(val) => onChange?.(val === NULL_SENTINEL ? null : val)}
        {...props}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedOption ? getOptionLabel(selectedOption) : null}
            </SelectValue>
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => {
              const val = getOptionValue(option);
              const label = getOptionLabel(option);
              return (
                <SelectItem value={val ?? NULL_SENTINEL} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, { selected: val === value })
                    : label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

interface SelectFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SelectFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function SelectFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: SelectFieldControllerProps<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest as SelectFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return <SelectField error={error?.message} {...restProps} {...field} />;
}

export { SelectField, SelectFieldController };
