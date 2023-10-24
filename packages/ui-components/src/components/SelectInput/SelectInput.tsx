import { Listbox, Transition, Portal } from '@headlessui/react';
import { clsx } from 'clsx';
import { Fragment } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';
import { HiChevronDown } from 'react-icons/hi2';
import { useDropdown } from '@src/hooks/useDropdown.js';
import {
  AddOptionRequiredFields,
  DropdownPropsBase,
} from '@src/types/dropdown.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';

export type SelectInputProps<OptionType> = DropdownPropsBase<OptionType> &
  AddOptionRequiredFields<OptionType>;

/**
 * An accessible stylable select component.
 */
export function SelectInput<OptionType>({
  className,
  options,
  name,
  disabled,
  onChange,
  value,
  noValueLabel = ' ',
  getOptionLabel = (option: OptionType) => (option as { label: string }).label,
  getOptionValue = (option: OptionType) => (option as { value: string }).value,
  label,
  error,
  description,
  fixed,
}: SelectInputProps<OptionType>): JSX.Element {
  const { popperProps, transitionProps, setReferenceElement } =
    useDropdown<HTMLButtonElement>({
      fixed,
    });

  const handleChange = (newValue?: string): void => {
    if (onChange) {
      if (!newValue) {
        onChange(null);
      } else {
        onChange(newValue);
      }
    }
  };

  const selectedOption = options.find(
    (option) => getOptionValue(option) === value
  );

  const PortalWrapper = fixed ? Portal : Fragment;

  return (
    <Listbox
      value={value}
      onChange={handleChange}
      name={name}
      disabled={disabled}
      as="div"
      className={clsx('space-y-2', className)}
    >
      {label && <Listbox.Label className="label-text">{label}</Listbox.Label>}
      <div>
        <Listbox.Button
          ref={setReferenceElement}
          className="ux-input relative flex items-center justify-between p-2.5 pr-10"
        >
          <div className={!selectedOption ? 'text-secondary' : ''}>
            {selectedOption ? getOptionLabel(selectedOption) : noValueLabel}
          </div>
          <HiChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
        </Listbox.Button>
        <PortalWrapper>
          <div {...popperProps} className="z-10">
            <Transition {...transitionProps}>
              <Listbox.Options className="popover-background border-normal z-10 max-h-72 overflow-y-auto rounded p-2 shadow">
                {options.map((option) => (
                  <Listbox.Option
                    className={({ selected }) =>
                      clsx(
                        'cursor-pointer rounded p-2 text-sm',
                        selected
                          ? 'bg-primary-500 text-white dark:bg-primary-600 dark:text-white'
                          : 'hover:bg-background-200 dark:hover:bg-background-700'
                      )
                    }
                    key={getOptionValue(option)}
                    value={getOptionValue(option)}
                  >
                    {getOptionLabel(option)}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </PortalWrapper>
      </div>
      {error ? (
        <FormError>{error}</FormError>
      ) : (
        description && <FormDescription>{description}</FormDescription>
      )}
    </Listbox>
  );
}

interface SelectInputControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<DropdownPropsBase<OptionType>, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type SelectInputControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = SelectInputControllerPropsBase<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>;

SelectInput.Controller = function SelectInputController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  onChange,
  ...rest
}: SelectInputControllerProps<
  OptionType,
  TFieldValues,
  TFieldName
>): JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const restProps = rest as SelectInputProps<OptionType>;

  return (
    <SelectInput
      onChange={(value) => {
        field.onChange(value as PathValue<TFieldValues, TFieldName>);
        onChange?.(value);
      }}
      value={field.value}
      error={error?.message}
      {...restProps}
    />
  );
};
