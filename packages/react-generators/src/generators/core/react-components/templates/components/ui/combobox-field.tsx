// @ts-nocheck

'use client';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  SelectOptionProps,
} from '$typesForm';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '$combobox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { useFieldIds } from '$hooksUseFieldIds';

export interface ComboboxFieldProps<OptionType>
  extends SelectOptionProps<OptionType>, FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  size?: 'sm' | 'default' | 'xl';
  placeholder?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  inputValue?: string;
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
  inputValue,
  onInputValueChange,
  getOptionLabel = (val) => (val as { label: string }).label,
  getOptionValue = (val) => (val as { value: string | null }).value,
  className,
  noResultsText,
  disabled,
  size = 'default',
  id,
  'aria-describedby': ariaDescribedBy,
}: ComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });

  const selectedOption =
    options.find((o) => getOptionValue(o) === value) ?? null;

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      {(!!label || !!description) && (
        <FieldContent>
          {label && <FieldLabel {...labelProps}>{label}</FieldLabel>}
          {description && (
            <FieldDescription {...descriptionProps}>
              {description}
            </FieldDescription>
          )}
        </FieldContent>
      )}
      <Combobox
        value={selectedOption}
        onValueChange={(option) => {
          onChange?.(option ? getOptionValue(option) : null);
        }}
        inputValue={inputValue}
        onInputValueChange={onInputValueChange}
        disabled={disabled}
        items={options}
        itemToStringLabel={getOptionLabel}
        itemToStringValue={(option) => getOptionValue(option) ?? ''}
        autoHighlight
      >
        <ComboboxInput
          {...controlProps}
          size={size}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
        <ComboboxContent size={size}>
          <ComboboxEmpty>{noResultsText ?? 'No results found'}</ComboboxEmpty>
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
      <FieldError {...errorProps}>{error}</FieldError>
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
