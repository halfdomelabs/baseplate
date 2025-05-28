import type { ComboboxFieldProps } from '@halfdomelabs/ui-components';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  ComboboxField,
  useControllerMerged,
} from '@halfdomelabs/ui-components';
import { useMemo, useState } from 'react';

import { FeatureUtils } from '#src/definition/index.js';

import { useProjectDefinition } from '../hooks/useProjectDefinition.js';

interface FeatureComboboxFieldProps
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

function FeatureComboboxField({
  canCreate,
  value,
  ...rest
}: FeatureComboboxFieldProps): React.ReactElement {
  const { definition } = useProjectDefinition();
  const [searchQuery, setSearchQuery] = useState('');

  const featureOptions = useMemo(() => {
    const baseFeatures = definition.features.map((feature) => ({
      label: feature.name,
      value: feature.id,
    }));

    if (!canCreate) return baseFeatures;

    const newFeatureName = searchQuery ? searchQuery : value;

    const doesNewFeatureExist = !!baseFeatures.some(
      (option) =>
        option.label === newFeatureName || option.value === newFeatureName,
    );

    return !doesNewFeatureExist &&
      newFeatureName &&
      FeatureUtils.validateFeatureName(newFeatureName)
      ? [...baseFeatures, createCreateOption(newFeatureName)]
      : baseFeatures;
  }, [definition.features, searchQuery, value, canCreate]);

  return (
    <ComboboxField
      placeholder="Select a feature"
      {...rest}
      searchQuery={canCreate ? searchQuery : undefined}
      onSearchQueryChange={setSearchQuery}
      options={featureOptions}
      value={value}
    />
  );
}

interface FeatureComboboxFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FeatureComboboxFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function FeatureComboboxFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: FeatureComboboxFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest;

  return (
    <FeatureComboboxField
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { FeatureComboboxField, FeatureComboboxFieldController };
