import { Combobox, Transition, Portal } from '@headlessui/react';
import { ModifierPhases } from '@popperjs/core/index.js';
import { clsx } from 'clsx';
import { useId, useMemo, useRef, useState, Fragment } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  useController,
} from 'react-hook-form';
import { HiChevronDown } from 'react-icons/hi2';
import { Modifier, usePopper } from 'react-popper';
import { COMPONENT_STRINGS } from '@src/constants/strings.js';
import { LabellableComponent } from '@src/types/form.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';

type OptionToStringFunc<OptionType> = (value: OptionType) => string;

export interface ComboboxInputPropsBase<OptionType>
  extends LabellableComponent {
  options: OptionType[];
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(value: string | null): void;
  value?: string | null;
  getOptionLabel?: OptionToStringFunc<OptionType>;
  getOptionValue?: OptionToStringFunc<OptionType>;
  renderOption?: (
    option: OptionType,
    state: { selected: boolean }
  ) => JSX.Element;
  noValueLabel?: string;
  fixed?: boolean;
}

type AddOptionRequiredFields<OptionType> = (OptionType extends { label: string }
  ? unknown
  : {
      getOptionLabel: OptionToStringFunc<OptionType>;
    }) &
  (OptionType extends { value: string | number }
    ? unknown
    : {
        getOptionValue: OptionToStringFunc<OptionType>;
      });

export type ComboboxInputProps<OptionType> =
  ComboboxInputPropsBase<OptionType> & AddOptionRequiredFields<OptionType>;

/**
 * An accessible stylable select component.
 */
export function ComboboxInput<OptionType>({
  className,
  options,
  name,
  disabled,
  onChange,
  value,
  noValueLabel = ' ',
  getOptionLabel = (option: OptionType) => (option as { label: string }).label,
  getOptionValue = (option: OptionType) => (option as { value: string }).value,
  renderOption,
  label,
  error,
  description,
  fixed,
}: ComboboxInputProps<OptionType>): JSX.Element {
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLInputElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  const [filter, setFilter] = useState('');

  // adapted from https://github.com/floating-ui/floating-ui/issues/794#issuecomment-824220211
  const modifiers: Modifier<'offset' | 'sameWidth'>[] = useMemo(
    () => [
      { name: 'offset', options: { offset: [0, 8] } },
      {
        name: 'sameWidth',
        enabled: true,
        phase: 'beforeWrite' as ModifierPhases,
        requires: ['computeStyles'],
        fn({ state: draftState }) {
          draftState.styles.popper.minWidth = `${draftState.rects.reference.width}px`;
        },
        effect({ state: draftState }) {
          draftState.elements.popper.style.minWidth = `${
            (draftState.elements.reference as HTMLDivElement).offsetWidth
          }px`;
        },
      },
    ],
    []
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
    modifiers,
    strategy: fixed ? 'fixed' : undefined,
  });

  const handleChange = (newValue?: string): void => {
    setFilter('');
    if (onChange) {
      if (!newValue) {
        onChange(null);
      } else {
        onChange(newValue);
      }
    }
  };

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(filter.toLowerCase())
  );

  const selectedOption = options.find(
    (option) => getOptionValue(option) === value
  );

  const inputId = useId();

  const PortalWrapper = fixed ? Portal : Fragment;
  return (
    <Combobox
      value={value}
      onChange={handleChange}
      name={name}
      disabled={disabled}
      as="div"
      className={clsx('space-y-2', className)}
    >
      {label && <Combobox.Label className="label-text">{label}</Combobox.Label>}
      <div>
        <Combobox.Button className="relative w-full">
          {!filter && (
            <label
              className={clsx(
                'absolute left-0 right-6 top-1/2 -translate-y-1/2 transform overflow-hidden text-ellipsis p-2.5 text-left text-sm',
                !selectedOption ? 'text-secondary' : ''
              )}
              htmlFor={inputId}
            >
              {selectedOption ? getOptionLabel(selectedOption) : noValueLabel}
            </label>
          )}
          <Combobox.Input
            ref={setReferenceElement}
            className="ux-input flex items-center justify-between p-2.5 pr-8"
            onChange={(e) => setFilter(e.target.value)}
            displayValue={() => ''}
            id={inputId}
          />
          <HiChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
        </Combobox.Button>
        <PortalWrapper>
          <div
            ref={popperElementRef}
            style={styles.popper}
            className="z-10"
            {...attributes.popper}
          >
            <Transition
              enter="ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              beforeEnter={() => setPopperElement(popperElementRef.current)}
              afterLeave={() => setPopperElement(null)}
            >
              <Combobox.Options className="popover-background border-normal max-h-72 overflow-y-auto rounded p-2 shadow">
                {!filteredOptions.length && (
                  <div className="text-secondary p-2 text-sm">
                    {COMPONENT_STRINGS.noOptions}
                  </div>
                )}
                {filteredOptions.map((option) => (
                  <Combobox.Option
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
                    {({ selected }) =>
                      renderOption ? (
                        renderOption(option, { selected })
                      ) : (
                        <>{getOptionLabel(option)}</>
                      )
                    }
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Transition>
          </div>
        </PortalWrapper>
      </div>
      {error ? (
        <FormError>{error}</FormError>
      ) : (
        description && <FormDescription>{description}</FormDescription>
      )}
    </Combobox>
  );
}

interface ComboboxInputControllerPropsBase<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ComboboxInputPropsBase<OptionType>, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type ComboboxInputControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = ComboboxInputControllerPropsBase<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>;

ComboboxInput.Controller = function ComboboxInputController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  onChange,
  ...rest
}: ComboboxInputControllerProps<
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

  const handleChange = (newValue: string): void => {
    if (onChange) {
      onChange(newValue);
    }
    field.onChange(newValue as PathValue<TFieldValues, TFieldName>);
  };

  const restProps = rest as ComboboxInputProps<OptionType>;

  return (
    <ComboboxInput
      onChange={handleChange}
      value={field.value}
      error={error?.message}
      {...restProps}
    />
  );
};
