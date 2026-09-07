// @ts-nocheck

'use client';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  MultiSelectOptionProps,
} from '$typesForm';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '$combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '$field';
import { useControllerMerged } from '$hooksUseControllerMerged';
import { useFieldIds } from '$hooksUseFieldIds';
import { Fragment, useMemo } from 'react';

export interface MultiComboboxFieldProps<OptionType>
  extends MultiSelectOptionProps<OptionType>, FormFieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
  size?: 'sm' | 'default' | 'xl';
}

/**
 * Field with label and error states that wraps a Combobox with multi-select (chips) support.
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
  disabled,
  size = 'default',
  id,
  'aria-describedby': ariaDescribedBy,
}: MultiComboboxFieldProps<OptionType> &
  AddOptionRequiredFields<OptionType>): React.ReactElement {
  const { labelProps, controlProps, descriptionProps, errorProps } =
    useFieldIds({
      id,
      'aria-describedby': ariaDescribedBy,
      description,
      error,
    });
  const chipsRef = useComboboxAnchor();

  const selectedOptions = useMemo(
    () => options.filter((o) => value?.includes(getOptionValue(o))),
    [value, options, getOptionValue],
  );

  return (
    <Field
      data-invalid={!!error}
      data-disabled={disabled ?? undefined}
      className={className}
    >
      <FieldLabel {...labelProps}>{label}</FieldLabel>
      <Combobox
        multiple
        autoHighlight
        value={selectedOptions}
        onValueChange={(selectedOpts) => {
          onChange?.(selectedOpts.map((o) => getOptionValue(o)));
        }}
        disabled={disabled}
        items={options}
        itemToStringLabel={getOptionLabel}
        itemToStringValue={getOptionValue}
      >
        <ComboboxChips ref={chipsRef} size={size}>
          <ComboboxValue>
            {(values: OptionType[]) => (
              <Fragment>
                {values.map((option) => {
                  const val = getOptionValue(option);
                  return (
                    <ComboboxChip key={val}>
                      {getOptionLabel(option)}
                    </ComboboxChip>
                  );
                })}
                <ComboboxChipsInput
                  {...controlProps}
                  placeholder={values.length > 0 ? '' : placeholder}
                  aria-invalid={!!error}
                />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={chipsRef} size={size}>
          <ComboboxEmpty>{noResultsText ?? 'No results found'}</ComboboxEmpty>
          <ComboboxList>
            {(option: OptionType) => {
              const val = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              return (
                <ComboboxItem value={option} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, {
                        selected: value?.includes(val) ?? false,
                      })
                    : optionLabel}
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription {...descriptionProps}>{description}</FieldDescription>
      <FieldError {...errorProps}>{error}</FieldError>
    </Field>
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
    <MultiComboboxField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? []}
    />
  );
}

export { MultiComboboxField, MultiComboboxFieldController };
