import { Listbox, Transition, Portal } from '@headlessui/react';
import { ModifierPhases } from '@popperjs/core/index.js';
import { clsx } from 'clsx';
import { Fragment, useMemo, useRef, useState } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  useController,
} from 'react-hook-form';
import { HiChevronDown } from 'react-icons/hi2';
import { Modifier, usePopper } from 'react-popper';
import { LabellableComponent } from '@src/types/form.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';

type OptionToStringFunc<OptionType> = (value: OptionType) => string;

export interface SelectInputPropsBase<OptionType> extends LabellableComponent {
  options: OptionType[];
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(value: string | number | null): void;
  value?: string | null;
  getOptionLabel?: OptionToStringFunc<OptionType>;
  getOptionValue?: OptionToStringFunc<OptionType>;
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

export type SelectInputProps<OptionType> = SelectInputPropsBase<OptionType> &
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
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();

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
    placement: 'bottom-start',
    modifiers,
    strategy: fixed ? 'fixed' : undefined,
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
          className="ux-input flex items-center justify-between space-x-2 p-2.5"
        >
          <div className={!selectedOption ? 'text-secondary' : ''}>
            {selectedOption ? getOptionLabel(selectedOption) : noValueLabel}
          </div>
          <HiChevronDown className="h-4 w-4" />
        </Listbox.Button>
        <PortalWrapper>
          <div
            ref={popperElementRef}
            style={styles.popper}
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
              <Listbox.Options className="popover-background border-normal rounded p-2 shadow">
                {options.map((option) => (
                  <Listbox.Option
                    className="cursor-pointer rounded p-2 text-sm hover:bg-background-200 ui-selected:bg-primary-500 ui-selected:text-white dark:hover:bg-background-700 dark:ui-selected:bg-primary-600 dark:ui-selected:text-white"
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
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<SelectInputPropsBase<OptionType>, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

type SelectInputControllerProps<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = SelectInputControllerPropsBase<OptionType, TFieldValues, TFieldName> &
  AddOptionRequiredFields<OptionType>;

SelectInput.Controller = function SelectInputController<
  OptionType,
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
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
      onChange={(value) => field.onChange(value)}
      value={field.value}
      error={error?.message}
      {...restProps}
    />
  );
};
