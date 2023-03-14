import classNames from 'classnames';
import {
  Control,
  FieldPath,
  FieldValues,
  useController,
} from 'react-hook-form';
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

interface ReactSelectInputControllerProps<T extends FieldValues>
  extends Omit<Props, 'onChange' | 'onBlur' | 'value'> {
  label?: string;
  className?: string;
  control: Control<T>;
  name: FieldPath<T>;
}

ReactSelectInput.LabelledController = function ReactSelectInputController<
  T extends FieldValues
>({
  label,
  className,
  name,
  control,
  ...rest
}: ReactSelectInputControllerProps<T>): JSX.Element {
  const {
    field,
    fieldState: { error },
    // TODO: Figure out field hack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useController<any>({
    name,
    control,
  });

  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <ReactSelectInput
        {...rest}
        onChange={field.onChange}
        onBlur={field.onBlur}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value={field.value}
      />
      {error && <FormError>{error.message}</FormError>}
    </div>
  );
};

export default ReactSelectInput;
