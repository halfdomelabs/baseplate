'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useId } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '#src/types/form.js';

import { useComponentStrings } from '#src/contexts/component-strings.js';
import { useControllerMerged } from '#src/hooks/use-controller-merged.js';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../combobox/combobox.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';

export interface ComboboxFieldProps<OptionType>
  extends SelectOptionProps<OptionType>, FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  value?: string | null;
  onChange?: (value: string | null) => void;
  onInputValueChange?: (value: string) => void;
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
  onInputValueChange,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string | null }).value,
  className,
  noResultsText,
  disabled,
}: ComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const { comboboxNoResults } = useComponentStrings();
  const id = useId();

  const selectedOption =
    options.find((o) => getOptionValue(o) === value) ?? null;

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        value={selectedOption}
        onValueChange={(option) => {
          onChange?.(option ? getOptionValue(option) : null);
        }}
        onInputValueChange={onInputValueChange}
        disabled={disabled}
        items={options}
        itemToStringLabel={getOptionLabel}
        itemToStringValue={(option) => getOptionValue(option) ?? ''}
        autoHighlight
      >
        <ComboboxInput id={id} placeholder={placeholder} />
        <ComboboxContent>
          <ComboboxEmpty>{noResultsText ?? comboboxNoResults}</ComboboxEmpty>
          <ComboboxList>
            {(option: OptionType) => {
              const val = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              return (
                <ComboboxItem value={option} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, { selected: val === value })
                    : optionLabel}
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
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
