import classNames from 'classnames';
import { Control, FieldPath, useController } from 'react-hook-form';
import Select from 'react-select';
import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  options: { label: string; value: string }[];
  onChange: (newValue?: string) => void;
  onBlur?: () => void;
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
      className={classNames('shadow-sm', className)}
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
  label?: React.ReactNode;
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

interface ReactSelectInputLabelledControllerProps<T>
  extends Omit<
    ReactSelectInputLabelledProps,
    'onChange' | 'onBlur' | 'value' | 'error'
  > {
  className?: string;
  control: Control<T>;
  name: FieldPath<T>;
  emptyAsNull?: boolean;
}

ReactSelectInput.LabelledController = function ReactSelectInputController<T>({
  className,
  name,
  control,
  emptyAsNull,
  ...rest
}: ReactSelectInputLabelledControllerProps<T>): JSX.Element {
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
      error={error}
      onChange={(val) => {
        if (!val && emptyAsNull) {
          field.onChange(null);
        } else {
          field.onChange(val);
        }
      }}
      onBlur={field.onBlur}
      value={field.value as string}
    />
  );
};

export default ReactSelectInput;
