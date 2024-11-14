import type { ComboboxFieldProps } from '@halfdomelabs/ui-components';
import type { ForwardedRef } from 'react';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  ComboboxField,
  genericForwardRef,
  useControllerMerged,
} from '@halfdomelabs/ui-components';
import { forwardRef, useMemo, useState } from 'react';

import { FeatureUtils } from '@src/definition/index.js';

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

const FeatureComboboxFieldRoot = forwardRef<
  HTMLInputElement,
  FeatureComboboxFieldProps
>(({ canCreate, value, ...rest }, ref) => {
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
      ref={ref}
    />
  );
});

FeatureComboboxFieldRoot.displayName = 'FeatureComboboxField';

interface FeatureComboboxFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FeatureComboboxFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

const FeatureComboboxFieldController = genericForwardRef(
  function FeatureComboboxFieldController<
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      name,
      control,
      ...rest
    }: FeatureComboboxFieldControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLInputElement>,
  ): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useControllerMerged({ name, control }, rest, ref);

    const restProps = rest;

    return (
      <FeatureComboboxField
        error={error?.message}
        {...restProps}
        {...field}
        value={field.value ?? null}
      />
    );
  },
);

export const FeatureComboboxField = Object.assign(FeatureComboboxFieldRoot, {
  Controller: FeatureComboboxFieldController,
});
