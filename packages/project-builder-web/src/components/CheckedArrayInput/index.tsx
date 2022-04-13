import classNames from 'classnames';
import { Control, FieldPath, useController } from 'react-hook-form';
import CheckedInput from '../CheckedInput';
import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  options: { label: string; value: string }[];
  onChange: (newValues: string[]) => void;
  value: string[];
}

function CheckedArrayInput({
  className,
  options,
  onChange,
  value: values = [],
}: Props): JSX.Element {
  return (
    <div className={classNames('flex flex-row space-x-4', className)}>
      {options.map((option) => (
        <CheckedInput.Labelled
          key={option.value}
          label={option.label}
          checked={values.includes(option.value)}
          onChange={(checked) => {
            const filteredValues = values.filter((v) => v !== option.value);
            return onChange(
              checked ? [...filteredValues, option.value] : filteredValues
            );
          }}
        />
      ))}
    </div>
  );
}

interface CheckedArrayInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

CheckedArrayInput.Labelled = function CheckedArrayInputLabelled({
  label,
  className,
  error,
  ...rest
}: CheckedArrayInputLabelledProps): JSX.Element {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <CheckedArrayInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface CheckedArrayInputLabelledControllerProps<T>
  extends Omit<CheckedArrayInputLabelledProps, 'onChange' | 'value'> {
  control: Control<T>;
  name: FieldPath<T>;
}

CheckedArrayInput.LabelledController =
  function CheckedArrayInputLabelledController<T>({
    name,
    control,
    ...rest
  }: CheckedArrayInputLabelledControllerProps<T>): JSX.Element {
    const {
      field,
      fieldState: { error },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = useController<any>({ control, name });

    return (
      <CheckedArrayInput.Labelled
        error={error?.message}
        onChange={field.onChange}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value={field.value}
        {...rest}
      />
    );
  };

export default CheckedArrayInput;
