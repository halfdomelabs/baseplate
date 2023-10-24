import classNames from 'classnames';
import { ChangeEventHandler, HTMLInputTypeAttribute } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  type?: HTMLInputTypeAttribute;
  register?: UseFormRegisterReturn;
  value?: string;
  readOnly?: boolean;
  onTextChange?: (text: string) => void;
}

const TextAreaInput = function TextAreaInput({
  className,
  disabled,
  placeholder,
  name,
  type = 'text',
  value,
  onTextChange,
  register,
  readOnly,
}: Props): JSX.Element {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (onTextChange) {
      onTextChange(e.target.value);
    }
  };
  const inputProps = {
    name,
    placeholder,
    disabled,
    type,
    value,
    onChange: handleChange,
    readOnly,
    ...register,
  };
  return (
    <textarea
      className={classNames(
        'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500',
        className
      )}
      {...inputProps}
    />
  );
};

interface TextAreaInputLabelledProps extends Props {
  label: string;
  error?: React.ReactNode;
}

TextAreaInput.Labelled = function TextAreaInputLabelled({
  label,
  className,
  error,
  ...rest
}: TextAreaInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={classNames('block', className)}>
      <FormLabel>{label}</FormLabel>
      <TextAreaInput {...rest} />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-500">{error}</p>
      )}
    </label>
  );
};

export default TextAreaInput;
