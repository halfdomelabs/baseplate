'use client';

import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Fragment, useMemo } from 'react';

import type {
  AddOptionRequiredFields,
  FormFieldProps,
  MultiSelectOptionProps,
} from '#src/types/form.js';

import { useComponentStrings } from '#src/contexts/component-strings.js';
import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { useFieldIds } from '#src/hooks/use-field-ids.js';

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
} from '../combobox/combobox.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';

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
  const { comboboxNoResults } = useComponentStrings();
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
          <ComboboxEmpty>{noResultsText ?? comboboxNoResults}</ComboboxEmpty>
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
