import { ForwardedRef } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';

import { Combobox } from '../Combobox/Combobox.js';
import { FormItem } from '../FormItem/FormItem.js';
import {
  AddOptionRequiredFields,
  DropdownPropsBase,
} from '@src/types/dropdown.js';
import { FieldProps, SelectOptionProps } from '@src/types/form.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface ComboboxFieldProps<OptionType>
  extends SelectOptionProps<OptionType>,
    FieldProps {
  className?: string;
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
    getOptionValue = (val) => (val as { value: string }).value,
    className,
    ...props
  }: ComboboxFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLDivElement>
): JSX.Element {
  const selectedOption = options.find((o) => getOptionValue(o) === value);
  const selectedValue = (() => {
    if (value === undefined) return undefined;
    if (!selectedOption) return null;
    return {
      label: getOptionLabel(selectedOption),
      value: getOptionValue(selectedOption),
    };
  })();

  return (
    <FormItem ref={ref} error={error} className={className}>
      {label && <FormItem.Label>{label}</FormItem.Label>}
      <Combobox
        value={selectedValue}
        onChange={(value) => {
          onChange?.(value ? value.value : null);
        }}
        {...props}
      >
        <FormItem.Control>
          <Combobox.Input placeholder={placeholder} />
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
> extends Omit<DropdownPropsBase<OptionType>, 'register'> {
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
      onChange,
      ...rest
    }: ComboboxFieldControllerProps<OptionType, TFieldValues, TFieldName> &
      AddOptionRequiredFields<OptionType>,
    ref: ForwardedRef<HTMLDivElement>
  ): JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useController({
      name,
      control,
    });

    const restProps = rest as ComboboxFieldProps<OptionType> &
      AddOptionRequiredFields<OptionType>;

    return (
      <ComboboxFieldRoot
        onChange={(value) => {
          field.onChange(value as PathValue<TFieldValues, TFieldName>);
          onChange?.(value);
        }}
        ref={ref}
        value={field.value}
        error={error?.message}
        {...restProps}
      />
    );
  }
);

export const ComboboxField = Object.assign(ComboboxFieldRoot, {
  Controller: ComboboxFieldController,
});
