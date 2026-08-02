'use client';

import type * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useId } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  RadioOptionProps,
} from '@src/types/form';

import { useControllerMerged } from '@src/hooks/use-controller-merged';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './field';
import { RadioGroup, RadioGroupItem } from './radio-group';

export interface RadioFieldProps<OptionType>
  extends RadioOptionProps<OptionType>, FormFieldProps {
  className?: string;
}

function RadioField<OptionType>({
  label,
  description,
  error,
  disabled,
  value,
  options,
  renderItemLabel,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string }).value,
  className,
  onChange,
  ...props
}: RadioFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const groupId = useId();

  return (
    <FieldSet
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      {label && <FieldLegend variant="label">{label}</FieldLegend>}
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange?.(val as string | null)}
        disabled={disabled}
        aria-invalid={!!error}
        {...props}
      >
        {options.map((option, index) => {
          const optionValue = getOptionValue(option);
          const itemId = `${groupId}-${index}`;
          return (
            <Field key={itemId} orientation="horizontal">
              <RadioGroupItem
                value={optionValue}
                id={itemId}
                disabled={disabled}
                aria-invalid={!!error}
              />
              <FieldLabel htmlFor={itemId} className="cursor-pointer">
                {renderItemLabel
                  ? renderItemLabel(option, { selected: optionValue === value })
                  : getOptionLabel(option)}
              </FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </FieldSet>
  );
}

interface RadioFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<RadioFieldProps<OptionType>, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function RadioFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: RadioFieldControllerProps<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest as RadioFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return (
    <RadioField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { RadioField, RadioFieldController };
