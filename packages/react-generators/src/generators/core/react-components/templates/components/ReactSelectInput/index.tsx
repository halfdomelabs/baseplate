import classNames from 'classnames';
import { Control, FieldPath, useController } from 'react-hook-form';
import Select from 'react-select';
import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  options: { label: string; value: string }[];
  onChange: (newValue?: string) => void;
  onBlur: () => void;
  value: string;
}

function ReactSelectInput({
  className,
  onChange,
  onBlur,
  options,
  value,
}: Props): JSX.Element {
  const selectedOption = options.find((option) => option.value === value);
  return (
    <Select
      className={classNames('', className)}
      onChange={(newValue) => {
        onChange(newValue?.value);
      }}
      onBlur={onBlur}
      value={selectedOption}
      options={options}
    />
  );
}

interface ReactSelectInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

ReactSelectInput.Labelled = function ReactSelectInputLabelled({
  label,
  className,
  error,
  ...rest
}: ReactSelectInputLabelledProps): JSX.Element {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <ReactSelectInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface ReactSelectInputControllerProps<T>
  extends Omit<Props, 'onChange' | 'onBlur' | 'value'> {
  label?: string;
  className?: string;
  control: Control<T>;
  name: FieldPath<T>;
}

ReactSelectInput.LabelledController = function ReactSelectInputController<T>({
  label,
  className,
  name,
  control,
  ...rest
}: ReactSelectInputControllerProps<T>): JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <ReactSelectInput.Labelled
      {...rest}
      label={label}
      error={error}
      onChange={field.onChange}
      onBlur={field.onBlur}
      value={field.value as string}
    />
  );
};

export default ReactSelectInput;
