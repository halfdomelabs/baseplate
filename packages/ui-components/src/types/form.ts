export interface FieldProps {
  label?: React.ReactNode;
  error?: React.ReactNode;
  description?: React.ReactNode;
}

export type SelectOptionLabelRenderer<OptionType> = (
  value: OptionType,
  options: { selected: boolean },
) => React.ReactNode;

export type SelectOptionStringExtractor<OptionType> = (
  value: OptionType,
) => string;

export interface MultiSelectOptionProps<OptionType> {
  options: OptionType[];
  onChange?(value: string[]): void;
  value?: string[];
  renderItemLabel?: SelectOptionLabelRenderer<OptionType>;
  getOptionLabel?: SelectOptionStringExtractor<OptionType>;
  getOptionValue?: SelectOptionStringExtractor<OptionType>;
  placeholder?: string;
}

export interface SelectOptionProps<OptionType> {
  options: OptionType[];
  onChange?(value: string | null): void;
  value?: string | null;
  renderItemLabel?: SelectOptionLabelRenderer<OptionType>;
  getOptionLabel?: SelectOptionStringExtractor<OptionType>;
  getOptionValue?: SelectOptionStringExtractor<OptionType>;
  placeholder?: string;
}

export type AddOptionRequiredFields<OptionType> = (OptionType extends {
  label: string;
}
  ? unknown
  : {
      renderItemLabel?: SelectOptionLabelRenderer<OptionType>;
      getOptionLabel: SelectOptionStringExtractor<OptionType>;
    }) &
  (OptionType extends { value: string | number }
    ? unknown
    : {
        getOptionValue: SelectOptionStringExtractor<OptionType>;
      });
