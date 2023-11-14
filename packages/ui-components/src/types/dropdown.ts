import { FieldProps } from './form.js';

export type OptionToStringFunc<OptionType> = (value: OptionType) => string;

export type DropdownPropsBase<OptionType> = FieldProps & {
  options: OptionType[];
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(value: string | null): void;
  value?: string | null;
  getOptionLabel?: OptionToStringFunc<OptionType>;
  getOptionValue?: OptionToStringFunc<OptionType>;
  noValueLabel?: string;
  fixed?: boolean;
};

export type AddOptionRequiredFields<OptionType> = (OptionType extends {
  label: string;
}
  ? unknown
  : {
      getOptionLabel: OptionToStringFunc<OptionType>;
    }) &
  (OptionType extends { value: string | number }
    ? unknown
    : {
        getOptionValue: OptionToStringFunc<OptionType>;
      });
