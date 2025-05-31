import type { ComboboxFieldProps } from '@baseplate-dev/ui-components';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  ComboboxField,
  useControllerMerged,
} from '@baseplate-dev/ui-components';
import { useMemo, useState } from 'react';

import { ModelUtils } from '#src/definition/index.js';

import { useProjectDefinition } from '../hooks/useProjectDefinition.js';

interface ModelComboboxFieldProps
  extends Omit<
    ComboboxFieldProps<{
      label: string;
      value: string;
    }>,
    'options'
  > {
  canCreate?: boolean;
}

function createCreateOption(value: string): { label: string; value: string } {
  return {
    label: `Create "${value}"`,
    value,
  };
}

function ModelComboboxField({
  canCreate,
  value,
  ...rest
}: ModelComboboxFieldProps): React.ReactElement {
  const { definition } = useProjectDefinition();
  const [searchQuery, setSearchQuery] = useState('');

  const modelOptions = useMemo(() => {
    const baseModels = definition.models.map((model) => ({
      label: model.name,
      value: model.id,
    }));

    if (!canCreate) return baseModels;

    const newModelName = searchQuery ? searchQuery : value;

    const doesNewModelExist = !!baseModels.some(
      (option) =>
        option.label === newModelName || option.value === newModelName,
    );

    return !doesNewModelExist &&
      newModelName &&
      ModelUtils.validateModelName(newModelName)
      ? [...baseModels, createCreateOption(newModelName)]
      : baseModels;
  }, [definition.models, searchQuery, value, canCreate]);

  return (
    <ComboboxField
      placeholder="Select a model"
      {...rest}
      searchQuery={canCreate ? searchQuery : undefined}
      onSearchQueryChange={setSearchQuery}
      options={modelOptions}
      value={value}
    />
  );
}

interface ModelComboboxFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ModelComboboxFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ModelComboboxFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: ModelComboboxFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest;

  return (
    <ModelComboboxField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { ModelComboboxField, ModelComboboxFieldController };
