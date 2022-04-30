// @ts-nocheck
import classNames from 'classnames';
import { UseFormRegisterReturn } from 'react-hook-form';
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
        'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
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

interface SelectInputLabelledController<T>
  extends Omit<SelectInputLabelledProps, 'register'> {
  control: Control<T>;
  name: FieldPath<T>;
}

SelectInput.LabelledController = function SelectInputController<T>({
  name,
  control,
  ...rest
}: SelectInputLabelledController<T>): JSX.Element {
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
