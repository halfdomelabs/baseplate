// @ts-nocheck
import classNames from 'classnames';
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  get,
  UseFormRegisterReturn,
  useFormState,
} from 'react-hook-form';
import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props {
  options: { value: string; label: string }[];
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(value: string): void;
  value?: string;
  register?: UseFormRegisterReturn;
}

function SelectInput({
  className,
  options,
  name,
  disabled,
  onChange,
  value,
  register,
}: Props): JSX.Element {
  const onChangeHandler =
    onChange &&
    ((event: React.ChangeEvent<HTMLSelectElement>): void => {
      onChange(event.target.value);
    });

  const selectProps = {
    name,
    disabled,
    onChange: onChangeHandler,
    value,
    ...register,
  };
  return (
    <select
      className={classNames(
        'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500',
        className
      )}
      {...selectProps}
    >
      {options.map(({ value: optionValue, label }) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

interface SelectInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

SelectInput.Labelled = function SelectInputLabelled({
  label,
  className,
  error,
  ...rest
}: SelectInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={classNames('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <SelectInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface SelectInputLabelledController<T extends FieldValues>
  extends Omit<SelectInputLabelledProps, 'register'> {
  control: Control<T>;
  name: FieldPath<T>;
}

SelectInput.LabelledController = function SelectInputController<
  T extends FieldValues
>({ name, control, ...rest }: SelectInputLabelledController<T>): JSX.Element {
  const { errors } = useFormState({ name, control });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <SelectInput.Labelled
      register={control.register(name)}
      error={error?.message}
      {...rest}
    />
  );
};

export default SelectInput;
