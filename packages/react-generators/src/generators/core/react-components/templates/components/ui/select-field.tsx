// @ts-nocheck

'use client';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '$typesForm';
import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { useFieldIds } from '$hooksUseFieldIds';
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
  size?: 'sm' | 'default' | 'xl';
}

function SelectField<OptionType>({
  label,
  description,
  error,
  disabled,
  value,
  placeholder,
  options,
  renderItemLabel,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string }).value,
  className,
  onChange,
  size = 'default',
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: SelectFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });
  const selectedOption = options.find((o) => getOptionValue(o) === value);

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      <FieldLabel {...labelProps}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(val) => onChange?.(val)}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger {...controlProps} size={size} aria-invalid={!!error}>
          <SelectValue placeholder={placeholder}>
            {selectedOption ? getOptionLabel(selectedOption) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent size={size}>
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
      <FieldDescription {...descriptionProps}>{description}</FieldDescription>
      <FieldError {...errorProps}>{error}</FieldError>
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

  return (
    <SelectField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { SelectField, SelectFieldController };
