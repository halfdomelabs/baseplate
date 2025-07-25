import type React from 'react';
import type {
  Control,
  DefaultValues,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FormItem,
  FormLabel,
  FormMessage,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useController } from 'react-hook-form';

export interface EmbeddedListTableProps<InputType> {
  items: InputType[];
  edit: (index: number) => void;
  remove: (index: number) => void;
}

export interface EmbeddedListFormProps<InputType> {
  initialData?: DefaultValues<InputType>;
  onSubmit: (data: InputType) => void;
}

interface Props<InputType> {
  className?: string;
  onChange: (value: InputType[]) => void;
  renderTable: (
    tableProps: EmbeddedListTableProps<InputType>,
  ) => React.JSX.Element;
  renderForm: (
    formProps: EmbeddedListFormProps<InputType>,
  ) => React.JSX.Element;
  value: InputType[] | null | undefined;
  itemName?: string;
  defaultValue?: DefaultValues<InputType>;
}

export function EmbeddedListInput<InputType>({
  className,
  onChange,
  renderTable,
  renderForm,
  value,
  itemName,
  defaultValue = {} as DefaultValues<InputType>,
}: Props<InputType>): React.JSX.Element {
  const [valueToEdit, setValueToEdit] = useState<
    { idx?: number; data: DefaultValues<InputType> } | undefined
  >();

  const definedValue = value ?? [];

  const handleSubmit = (data: InputType): void => {
    if (valueToEdit?.idx === undefined) {
      onChange([...definedValue, data]);
    } else {
      onChange(
        definedValue.map((item, idx) =>
          idx === valueToEdit.idx ? data : item,
        ),
      );
    }
    setValueToEdit(undefined);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <Button
        size="sm"
        onClick={() => {
          setValueToEdit({ data: defaultValue });
        }}
      >
        Add Item
      </Button>
      {definedValue.length > 0 ? (
        renderTable({
          items: definedValue,
          edit: (idx) => {
            setValueToEdit({
              idx,
              data: definedValue[idx] as DefaultValues<InputType>,
            });
          },
          remove: (idx) => {
            onChange(definedValue.filter((_, i) => i !== idx));
          },
        })
      ) : (
        <Alert variant="default">
          <AlertTitle>No items currently</AlertTitle>
          <AlertDescription>Add an item to get started.</AlertDescription>
        </Alert>
      )}
      <Dialog
        open={!!valueToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setValueToEdit(undefined);
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit {itemName ?? 'Item'}</DialogTitle>
          </DialogHeader>
          {renderForm({
            initialData: valueToEdit?.data,
            onSubmit: handleSubmit,
          })}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EmbeddedListInputLabelledProps<InputType> extends Props<InputType> {
  label?: React.ReactNode;
  error?: React.ReactNode;
}

EmbeddedListInput.Labelled = function EmbeddedOneToOneInputLabelled<InputType>({
  label,
  className,
  error,
  ...rest
}: EmbeddedListInputLabelledProps<InputType>): React.JSX.Element {
  return (
    <div className={clsx('', className)}>
      <FormItem className={className}>
        {label && <FormLabel>{label}</FormLabel>}
        <EmbeddedListInput {...rest} />
        <FormMessage>{error}</FormMessage>
      </FormItem>
    </div>
  );
};

interface EmbeddedListInputLabelledControllerProps<
  FormType extends FieldValues,
  FormPath extends FieldPath<FormType>,
> extends Omit<
    EmbeddedListInputLabelledProps<
      Exclude<
        FieldPathValue<FormType, FormPath>,
        undefined | null
      > extends (infer InputType)[]
        ? InputType
        : never
    >,
    'onChange' | 'value' | 'error'
  > {
  className?: string;
  control: Control<FormType>;
  name: FormPath;
}

EmbeddedListInput.LabelledController =
  function EmbeddedListInputLabelledController<
    FormType extends FieldValues,
    FormPath extends FieldPath<FormType>,
  >({
    control,
    name,
    ...rest
  }: EmbeddedListInputLabelledControllerProps<
    FormType,
    FormPath
  >): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useController({
      name,
      control,
    });

    return (
      <EmbeddedListInput.Labelled
        {...rest}
        error={error?.message}
        onChange={(value) => {
          field.onChange(value as FieldPathValue<FormType, FormPath>);
        }}
        value={
          field.value as (FieldPathValue<
            FormType,
            FormPath
          > extends (infer InputType)[]
            ? InputType
            : never)[]
        }
      />
    );
  };
