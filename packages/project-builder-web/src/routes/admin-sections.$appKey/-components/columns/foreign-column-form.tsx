import type {
  AdminCrudForeignColumnDefinition,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';

interface Props {
  formProps: UseFormReturn<AdminCrudForeignColumnDefinition>;
  model: ModelConfig;
  pluginKey: string | undefined;
}

export function ForeignColumnForm({
  formProps,
  model,
}: Props): React.JSX.Element {
  const { control } = formProps;
  const { definitionContainer } = useProjectDefinition();

  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${definitionContainer.nameFromId(relation.modelRef)})`,
      value: relation.id,
    })) ?? [];

  return (
    <>
      <SelectFieldController
        label="Local Relation"
        control={control}
        name="localRelationRef"
        options={localRelationOptions}
        placeholder="Select a relation"
      />
      <InputFieldController
        label="Label Expression"
        control={control}
        name="labelExpression"
        placeholder="e.g. name"
        description="Field to display from the related model"
      />
      <InputFieldController
        label="Value Expression"
        control={control}
        name="valueExpression"
        placeholder="e.g. id"
        description="Field to use for matching the relation"
      />
    </>
  );
}
