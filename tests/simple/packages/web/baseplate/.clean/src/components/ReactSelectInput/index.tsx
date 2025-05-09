import type { ReactElement } from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  PathValue,
} from 'react-hook-form';
import type { GroupBase, InputProps } from 'react-select';

import clsx from 'clsx';
import { useController } from 'react-hook-form';
import Select, { components } from 'react-select';

import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props<ValueType = string> {
  className?: string;
  options: { label: string; value: ValueType }[];
  onChange: (newValue?: ValueType) => void;
  onBlur?: () => void;
  value: ValueType;
  fixedPosition?: boolean;
}

/**
 * we need to clear the box shadow since @tailwindcss/forms adds a ring
 * to all input type text
 *
 * https://github.com/JedWatson/react-select/issues/4686
 */
function Input<
  OptionType = unknown,
  IsMultiType extends boolean = boolean,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
>(props: InputProps<OptionType, IsMultiType, GroupType>): ReactElement {
  return <components.Input {...props} inputClassName="focus:ring-0" />;
}

function ReactSelectInput<ValueType>({
  className,
  onChange,
  onBlur,
  options,
  value,
  fixedPosition,
}: Props<ValueType>): ReactElement {
  const selectedOption = options.find((option) => option.value === value);

  const fixedPositionProps = fixedPosition
    ? {
        styles: {
          menuPortal: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 9999,
          }),
        },
        menuPosition: 'fixed' as const,
        menuPortalTarget: document.body,
      }
    : {};

  return (
    <Select
      className={clsx('shadow-sm', className)}
      onChange={(newValue) => {
        onChange(newValue?.value);
      }}
      isMulti={false}
      onBlur={onBlur}
      value={selectedOption}
      options={options}
      components={{ Input }}
      {...fixedPositionProps}
    />
  );
}

interface ReactSelectInputLabelledProps<ValueType = string>
  extends Props<ValueType> {
  label?: React.ReactNode;
  error?: React.ReactNode;
}

ReactSelectInput.Labelled = function ReactSelectInputLabelled({
  label,
  className,
  error,
  ...rest
}: ReactSelectInputLabelledProps): ReactElement {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <ReactSelectInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface ReactSelectInputLabelledControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
    ReactSelectInputLabelledProps<PathValue<TFieldValues, TFieldName>>,
    'onChange' | 'onBlur' | 'value' | 'error'
  > {
  className?: string;
  control: Control<TFieldValues>;
  name: TFieldName;
  emptyAsNull?: boolean;
}

ReactSelectInput.LabelledController = function ReactSelectInputController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  emptyAsNull,
  ...rest
}: ReactSelectInputLabelledControllerProps<
  TFieldValues,
  TFieldName
>): ReactElement {
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
      error={error?.message}
      onChange={(val) => {
        if (!val && emptyAsNull) {
          field.onChange(null as FieldPathValue<TFieldValues, TFieldName>);
        } else {
          field.onChange(val as FieldPathValue<TFieldValues, TFieldName>);
        }
      }}
      onBlur={field.onBlur}
      value={field.value as string}
    />
  );
};

export default ReactSelectInput;
