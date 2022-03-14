import { useField } from 'formik';
import React from 'react';
import classNames from 'classnames';

interface Props {
  name?: string;
  label?: string;
  error?: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  type?: 'text' | 'password';
  onChange: (value: string, name?: string) => void;
}

export const InputField = ({
  name,
  label,
  error,
  value,
  type,
  placeholder,
  onChange,
  autoFocus,
}: Props) => {
  return (
    <div className="field">
      {label && <label className="label">{label}</label>}
      <div className="control">
        <input
          className={classNames({
            input: true,
            'is-danger': !!error,
          })}
          type={type}
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value, name)}
        />
      </div>
      {error && <p className="help is-danger">{error}</p>}
    </div>
  );
};

interface InputFieldFormikProps
  extends Omit<Props, 'value' | 'onChange' | 'error'> {
  name: string;
}

function FormikInputField(props: InputFieldFormikProps) {
  const [field, meta, helpers] = useField(props.name);

  return (
    <InputField
      {...props}
      value={field.value}
      onChange={(value) => helpers.setValue(value)}
      error={meta.touched ? meta.error : undefined}
    />
  );
}

InputField.Formik = FormikInputField;
