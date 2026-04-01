import type { AdminCrudForeignColumnInput } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudColumnWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { adminCrudColumnEntityType } from '@baseplate-dev/project-builder-lib';
import {
  createAdminCrudColumnWebConfig,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

function ForeignColumnForm({
  formProps,
  model,
}: AdminCrudColumnWebFormProps<AdminCrudForeignColumnInput>): React.JSX.Element {
  const { control } = formProps;
  const { definitionContainer } = useProjectDefinition();

  const localRelationOptions = model.model.relations.map((relation) => ({
    label: `${relation.name} (${definitionContainer.nameFromId(relation.modelRef)})`,
    value: relation.id,
  }));

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

export const adminCrudForeignColumnWebConfig =
  createAdminCrudColumnWebConfig<AdminCrudForeignColumnInput>({
    name: 'foreign',
    pluginKey: undefined,
    label: 'Foreign Column',
    isAvailableForModel: (definition, modelId) => {
      // Foreign columns are available if the model has relations
      const model = definition.models.find((m) => m.id === modelId);
      return (model?.model.relations.length ?? 0) > 0;
    },
    Form: ForeignColumnForm,
    getNewColumn: () => ({
      id: adminCrudColumnEntityType.generateNewId(),
      type: 'foreign' as const,
      label: '',
      localRelationRef: '',
      labelExpression: '',
      valueExpression: '',
    }),
  });
