import classNames from 'classnames';
import { useEffect, useState } from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  useController,
} from 'react-hook-form';

import Button from '../Button';
import FormError from '../FormError';
import FormLabel from '../FormLabel';
import LinkButton from '../LinkButton';
import SelectInput from '../SelectInput';

interface Props {
  className?: string;
  options: { label: string; value: string }[];
  onChange: (newValues: string[]) => void;
  uniqueValues?: boolean;
  value: string[];
}

function SelectArrayInput({
  className,
  options,
  onChange,
  uniqueValues,
  value: values = [],
}: Props): JSX.Element {
  const availableOptions = uniqueValues
    ? options.filter((o) => !values.includes(o.value))
    : options;
  const [selectedValue, setSelectedValue] = useState(
    availableOptions[0]?.value || '',
  );
  useEffect(() => {
    if (!availableOptions.some((option) => option.value === selectedValue)) {
      setSelectedValue(availableOptions[0]?.value || '');
    }
  }, [availableOptions, selectedValue]);
  return (
    <div className={classNames('space-y-4', className)}>
      {values.map((value) => (
        <div key={value}>
          <span>
            {options.find((option) => option.value === value)?.label ?? value}
          </span>{' '}
          (
          <LinkButton
            onClick={() => {
              onChange(values.filter((v) => v !== value));
            }}
          >
            remove
          </LinkButton>
          )
        </div>
      ))}
      <div>{!values.length && 'No values present'}</div>
      <div className="flex flex-row space-x-4">
        <SelectInput
          className="w-full"
          options={availableOptions}
          onChange={(newValue) => setSelectedValue(newValue)}
          value={selectedValue}
        />
        <Button
          onClick={() => selectedValue && onChange([...values, selectedValue])}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

interface SelectArrayInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

SelectArrayInput.Labelled = function SelectArrayInputLabelled({
  label,
  className,
  error,
  ...rest
}: SelectArrayInputLabelledProps): JSX.Element {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <SelectArrayInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface SelectArrayInputLabelledControllerProps<T extends FieldValues>
  extends Omit<SelectArrayInputLabelledProps, 'onChange' | 'value'> {
  control: Control<T>;
  name: FieldPath<T>;
}

SelectArrayInput.LabelledController =
  function SelectArrayInputLabelledController<T extends FieldValues>({
    name,
    control,
    ...rest
  }: SelectArrayInputLabelledControllerProps<T>): JSX.Element {
    const {
      field,
      fieldState: { error },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = useController<any>({ control, name });

    return (
      <SelectArrayInput.Labelled
        error={error?.message}
        onChange={field.onChange}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value={field.value}
        {...rest}
      />
    );
  };

export default SelectArrayInput;
