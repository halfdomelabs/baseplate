'use client';

import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useId } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';

import { Field, FieldDescription, FieldError, FieldLabel } from './field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

export interface SelectFieldProps<OptionType>
  extends SelectOptionProps<OptionType>, FormFieldProps {
  className?: string;
}

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
  const triggerId = useId();
  const selectedOption = options.find((o) => getOptionValue(o) === value);

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
      <Select value={value} onValueChange={(val) => onChange?.(val)} {...props}>
        <SelectTrigger id={triggerId} aria-invalid={!!error}>
          <SelectValue placeholder={placeholder}>
            {selectedOption ? getOptionLabel(selectedOption) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => {
              const val = getOptionValue(option);
              const label = getOptionLabel(option);
              return (
                <SelectItem value={val} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, { selected: val === value })
                    : label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
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
