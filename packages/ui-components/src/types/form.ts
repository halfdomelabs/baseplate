export interface FieldProps {
  label?: React.ReactNode;
  error?: React.ReactNode;
  description?: React.ReactNode;
}

type SelectOptionLabelRenderer<OptionType> = (
  value: OptionType,
  options: { selected: boolean },
) => React.ReactNode;

type SelectOptionStringExtractor<OptionType> = (value: OptionType) => string;

type SelectOptionStringOrNullExtractor<OptionType> = (
  value: OptionType,
) => string | null;

export interface MultiSelectOptionProps<OptionType> {
  options: OptionType[];
  onChange?: (value: string[]) => void;
  value?: string[];
  renderItemLabel?: SelectOptionLabelRenderer<OptionType>;
  getOptionLabel?: SelectOptionStringExtractor<OptionType>;
  getOptionValue?: SelectOptionStringExtractor<OptionType>;
  placeholder?: string;
}

export interface SelectOptionProps<OptionType> {
  options: OptionType[];
  onChange?: (value: string | null) => void;
  value?: string | null;
  renderItemLabel?: SelectOptionLabelRenderer<OptionType>;
  getOptionLabel?: SelectOptionStringExtractor<OptionType>;
  getOptionValue?: SelectOptionStringOrNullExtractor<OptionType>;
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
  (OptionType extends { value: string }
    ? unknown
    : {
        getOptionValue: SelectOptionStringOrNullExtractor<OptionType>;
      });
