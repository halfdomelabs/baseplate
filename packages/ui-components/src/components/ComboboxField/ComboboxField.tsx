import type { ForwardedRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import type {
  AddOptionRequiredFields,
  FieldProps,
  SelectOptionProps,
} from '@src/types/form.js';

import { useComponentStrings } from '@src/contexts/ComponentStrings.js';
import { useControllerMerged } from '@src/hooks/useControllerMerged.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

import type { ComboboxProps } from '../Combobox/Combobox.js';

import { Combobox } from '../Combobox/Combobox.js';
import { FormItem } from '../FormItem/FormItem.js';

export interface ComboboxFieldProps<OptionType>
  extends Omit<ComboboxProps, 'value' | 'onChange' | 'label' | 'children'>,
    SelectOptionProps<OptionType>,
    FieldProps {
  className?: string;
  noResultsText?: React.ReactNode;
}

/**
 * Field with label and error states that wraps a Combobox component.
 */

const ComboboxFieldRoot = genericForwardRef(function ComboboxField<OptionType>(
  {
    label,
    description,
    error,
    value,
    placeholder,
    options,
    renderItemLabel,
    onChange,
    getOptionLabel = (val) => (val as { label: string }).label,
    getOptionValue = (val) => (val as { value: string | null }).value,
    className,
    noResultsText,
    ...props
  }: ComboboxFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLInputElement>,
): JSX.Element {
  const selectedOption = options.find((o) => getOptionValue(o) === value);
  const selectedComboboxOption = (() => {
    if (value === undefined) return;
    if (!selectedOption) return null;
    return {
      label: getOptionLabel(selectedOption),
      value: getOptionValue(selectedOption),
    };
  })();
  const { comboboxNoResults } = useComponentStrings();

  return (
    <FormItem error={error} className={className}>
      {label && <FormItem.Label>{label}</FormItem.Label>}
      <Combobox
        value={selectedComboboxOption}
        onChange={(value) => {
          onChange?.(value.value);
        }}
        {...props}
      >
        <FormItem.Control>
          <Combobox.Input placeholder={placeholder} ref={ref} />
        </FormItem.Control>
        <Combobox.Content>
          {options.map((option) => {
            const val = getOptionValue(option);
            const label = getOptionLabel(option);
            return (
              <Combobox.Item value={val} key={val} label={label}>
                {renderItemLabel
                  ? renderItemLabel(option, { selected: val === value })
                  : label}
              </Combobox.Item>
            );
          })}
          <Combobox.Empty>{noResultsText ?? comboboxNoResults}</Combobox.Empty>
        </Combobox.Content>
      </Combobox>
      {description && (
        <FormItem.Description>{description}</FormItem.Description>
      )}
      {error && <FormItem.Error>{error}</FormItem.Error>}
    </FormItem>
  );
});

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

const ComboboxFieldController = genericForwardRef(
  function ComboboxFieldController<
    OptionType,
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      name,
      control,
      ...rest
    }: ComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
      AddOptionRequiredFields<OptionType>,
    ref: ForwardedRef<HTMLInputElement>,
  ): JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    const restProps = rest as ComboboxFieldProps<OptionType> &
      AddOptionRequiredFields<OptionType>;

    return (
      <ComboboxFieldRoot
        error={error?.message}
        {...restProps}
        {...field}
        value={field.value ?? null}
      />
    );
  },
);

export const ComboboxField = Object.assign(ComboboxFieldRoot, {
  Controller: ComboboxFieldController,
});
