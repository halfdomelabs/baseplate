// @ts-nocheck

import type {
  FocusEventHandler,
  KeyboardEventHandler,
  ReactElement,
} from 'react';
import type {
  ChangeHandler,
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  RefCallBack,
  UseFormRegisterReturn,
} from 'react-hook-form';

import { format, parseISO } from 'date-fns';
import { forwardRef, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { useController } from 'react-hook-form';

import FormError from '../FormError/index.js';
import FormLabel from '../FormLabel/index.js';
import TextInput from '../TextInput/index.js';

import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  className?: string;
  onChange: (newValue?: string | null) => void;
  onBlur?: () => void;
  value: string | null;
  showTimeSelect?: boolean;
  isClearable?: boolean;
}

const DatePickerTextInput = forwardRef<
  HTMLInputElement,
  {
    onChange?: ChangeHandler;
    onClick?: () => void;
    onBlur?: ChangeHandler;
    onFocus?: FocusEventHandler<HTMLInputElement>;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
    value?: string;
    placeholder?: string;
    name?: string;
  }
>(({ onChange, onClick, onBlur, name, ...rest }, ref) => (
  <TextInput
    register={
      {
        ref: ref as RefCallBack,
        onChange,
        onBlur,
        name,
      } as UseFormRegisterReturn
    }
    {...rest}
  />
));

DatePickerTextInput.displayName = 'DatePickerTextInput';

function ReactDatePickerInput({
  className,
  onChange,
  onBlur,
  value,
  showTimeSelect,
  isClearable,
}: Props): ReactElement {
  const selectedDate = useMemo(() => (value ? parseISO(value) : null), [value]);
  return (
    <DatePicker
      className={className}
      onChange={(date) => {
        onChange(
          date &&
            (showTimeSelect ? date.toISOString() : format(date, 'yyyy-MM-dd')),
        );
      }}
      onBlur={onBlur}
      selected={selectedDate}
      customInput={<DatePickerTextInput />}
      showTimeSelect={showTimeSelect}
      timeFormat="HH:mm"
      showPopperArrow
      dateFormat={showTimeSelect ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'}
      isClearable={isClearable}
      placeholderText="Select a date"
      popperModifiers={[
        {
          name: 'arrow',
          options: {
            padding: ({ popper, reference }) => ({
              // keeps the arrow always to the left, otherwise it is off centered when the input is large
              // https://github.com/Hacker0x01/react-datepicker/issues/3176#issuecomment-1262100937
              right: Math.min(popper.width, reference.width) - 24,
            }),
          },
        },
      ]}
    />
  );
}

interface ReactDatePickerInputLabelledProps extends Props {
  label?: React.ReactNode;
  error?: React.ReactNode;
}

ReactDatePickerInput.Labelled = function ReactDatePickerInputLabelled({
  label,
  className,
  error,
  ...rest
}: ReactDatePickerInputLabelledProps): ReactElement {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <ReactDatePickerInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface ReactDatePickerInputLabelledControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
    ReactDatePickerInputLabelledProps,
    'onChange' | 'onBlur' | 'value' | 'error'
  > {
  className?: string;
  control: Control<TFieldValues>;
  name: TFieldName;
}

ReactDatePickerInput.LabelledController =
  function ReactDatePickerInputController<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >({
    className,
    name,
    control,
    ...rest
  }: ReactDatePickerInputLabelledControllerProps<
    TFieldValues,
    TFieldName
  >): ReactElement {
    const {
      field,
      fieldState: { error },
    } = useController({
      name,
      control,
    });

    return (
      <ReactDatePickerInput.Labelled
        {...rest}
        error={error?.message}
        onChange={(val) => {
          field.onChange(val as FieldPathValue<TFieldValues, TFieldName>);
        }}
        onBlur={field.onBlur}
        value={field.value as string}
      />
    );
  };

export default ReactDatePickerInput;
