import { ForwardedRef } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';

import { FormItem } from '../FormItem/FormItem.js';
import { Select } from '../Select/Select.js';
import {
  FieldProps,
  SelectOptionProps,
  AddOptionRequiredFields,
} from '@src/types/form.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';

export interface SelectFieldProps<OptionType>
  extends SelectOptionProps<OptionType>,
    FieldProps {
  className?: string;
}

const SelectFieldRoot = genericForwardRef(function SelectField<OptionType>(
  {
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
  }: SelectFieldProps<OptionType> & AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLDivElement>,
): JSX.Element {
  const selectedOption = options.find((o) => getOptionValue(o) === value);

  return (
    <FormItem ref={ref} error={error} className={className}>
      {label && <FormItem.Label>{label}</FormItem.Label>}
      <Select
        value={selectedOption ? value ?? undefined : undefined}
        onValueChange={(val) => onChange?.(val)}
        {...props}
      >
        <FormItem.Control>
          <Select.Trigger>
            <Select.Value placeholder={placeholder}>
              {selectedOption ? getOptionLabel(selectedOption) : null}
            </Select.Value>
          </Select.Trigger>
        </FormItem.Control>
        <Select.Content>
          <Select.Group>
            {options.map((option) => {
              const val = getOptionValue(option);
              const label = getOptionLabel(option);
              return (
                <Select.Item value={val} key={val}>
                  {renderItemLabel
                    ? renderItemLabel(option, { selected: val === value })
                    : label}
                </Select.Item>
              );
            })}
          </Select.Group>
        </Select.Content>
      </Select>
      {description && (
        <FormItem.Description>{description}</FormItem.Description>
      )}
      {error && <FormItem.Error>{error}</FormItem.Error>}
    </FormItem>
  );
});

interface SelectFieldControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SelectFieldProps<OptionType>, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type SelectFieldControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = SelectFieldControllerPropsBase<OptionType, TFieldValues, TFieldName>;

const SelectFieldController = genericForwardRef(function SelectFieldController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    name,
    control,
    onChange,
    ...rest
  }: SelectFieldControllerProps<OptionType, TFieldValues, TFieldName> &
    AddOptionRequiredFields<OptionType>,
  ref: ForwardedRef<HTMLDivElement>,
): JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const restProps = rest as SelectFieldProps<OptionType> &
    AddOptionRequiredFields<OptionType>;

  return (
    <SelectFieldRoot
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
});

export const SelectField = Object.assign(SelectFieldRoot, {
  Controller: SelectFieldController,
});
