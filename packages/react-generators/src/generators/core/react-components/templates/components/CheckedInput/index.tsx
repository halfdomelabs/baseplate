// @ts-nocheck
/* eslint-disable jsx-a11y/label-has-associated-control */
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
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(checked: boolean, value?: string): void;
  checked?: boolean;
  value?: string;
  type?: 'checkbox' | 'radio';
  register?: UseFormRegisterReturn;
}

function CheckedInput({
  className,
  name,
  disabled,
  onChange,
  checked,
  value,
  register,
  type = 'checkbox',
}: Props): JSX.Element {
  const onChangeHandler =
    onChange &&
    ((event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.checked, event.target.value);
    });

  const inputProps = {
    name,
    disabled,
    onChange: onChangeHandler,
    checked,
    value,
    type,
    ...register,
  };
  return (
    <input
      className={classNames(
        'h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500',
        { rounded: type === 'checkbox' },
        className
      )}
      {...inputProps}
    />
  );
}

interface CheckedInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
  horizontalLabel?: boolean;
}

CheckedInput.Labelled = function SelectInputLabelled({
  label,
  className,
  error,
  horizontalLabel,
  ...rest
}: CheckedInputLabelledProps): JSX.Element {
  if (horizontalLabel) {
    return (
      <div>
        <label
          className={classNames('flex cursor-pointer items-center', className)}
        >
          <CheckedInput {...rest} />
          {label && (
            <div className="ml-2 w-full py-3 text-sm font-medium text-gray-900">
              {label}
            </div>
          )}
        </label>
        {error && <FormError>{error}</FormError>}
      </div>
    );
  }
  return (
    <label className={classNames('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <CheckedInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

export interface CheckedInputLabelledControllerProps<T extends FieldValues>
  extends Omit<CheckedInputLabelledProps, 'register'> {
  control: Control<T>;
  name: FieldPath<T>;
  noError?: boolean;
}

CheckedInput.LabelledController = function CheckedInputLabelledController<
  T extends FieldValues
>({
  control,
  name,
  noError,
  ...rest
}: CheckedInputLabelledControllerProps<T>): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <CheckedInput.Labelled
      register={control.register(name)}
      error={noError ? undefined : error?.message}
      {...rest}
    />
  );
};

export default CheckedInput;
