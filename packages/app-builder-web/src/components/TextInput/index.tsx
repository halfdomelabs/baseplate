import classNames from 'classnames';
import { HTMLInputTypeAttribute } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  type?: HTMLInputTypeAttribute;
  register?: UseFormRegisterReturn;
}

const TextInput = function TextInput({
  className,
  disabled,
  placeholder,
  name,
  type = 'text',
  register,
}: Props): JSX.Element {
  const inputProps = { name, placeholder, disabled, type, ...register };
  return (
    <input
      className={classNames(
        'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
        className
      )}
      {...inputProps}
    />
  );
};

interface TextInputLabelledProps extends Props {
  label: string;
  error?: React.ReactNode;
}

TextInput.Labelled = function TextInputLabelled({
  label,
  className,
  error,
  ...rest
}: TextInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={classNames('block', className)}>
      <FormLabel>{label}</FormLabel>
      <TextInput {...rest} />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-500">{error}</p>
      )}
    </label>
  );
};

export default TextInput;
