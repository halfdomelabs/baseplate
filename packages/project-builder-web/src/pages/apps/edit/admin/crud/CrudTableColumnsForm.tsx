import type { AdminCrudSectionConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  adminCrudDisplayTypes,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  InputFieldController,
  SelectField,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useFieldArray, useWatch } from 'react-hook-form';

import { CollapsibleRow } from '@src/components';

export type AdminCrudTableConfig = Pick<
  AdminCrudSectionConfig,
  'table' | 'modelRef'
>;

interface Props {
  className?: string;
  control: Control<AdminCrudTableConfig>;
}

function ColumnForm({
  idx,
  control,
  fieldOptions,
  localRelationOptions,
}: {
  idx: number;
  control: Control<AdminCrudTableConfig>;
  fieldOptions: { label: string; value: string }[];
  localRelationOptions: { label: string; value: string }[];
}): React.JSX.Element {
  const displayTypeOptions = adminCrudDisplayTypes.map((t) => ({
    label: t,
    value: t,
  }));
  const type = useWatch({ control, name: `table.columns.${idx}.display.type` });
  return (
    <div className="space-y-4">
      <SelectField.Controller
        label="Type"
        control={control}
        options={displayTypeOptions}
        name={`table.columns.${idx}.display.type`}
      />
      <InputFieldController
        label="Label"
        control={control}
        name={`table.columns.${idx}.label`}
      />

      {type === 'text' && (
        <SelectField.Controller
          label="Field"
          control={control}
          name={`table.columns.${idx}.display.modelFieldRef`}
          options={fieldOptions}
        />
      )}
      {type === 'foreign' && (
        <>
          <SelectField.Controller
            label="Local Relation Name"
            control={control}
            name={`table.columns.${idx}.display.localRelationRef`}
            options={localRelationOptions}
          />
          <InputFieldController
            label="Label Expression (e.g. name)"
            control={control}
            name={`table.columns.${idx}.display.labelExpression`}
          />
          <InputFieldController
            label="Value Expression (e.g. id)"
            control={control}
            name={`table.columns.${idx}.display.valueExpression`}
          />
        </>
      )}
    </div>
  );
}

function CrudTableColumnsForm({
  className,
  control,
}: Props): React.JSX.Element {
  const modelRef = useWatch({ control, name: 'modelRef' });
  const { definition, definitionContainer } = useProjectDefinition();
  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'table.columns',
  });

  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${definitionContainer.nameFromId(relation.modelRef)})`,
      value: relation.id,
    })) ?? [];

  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.id,
    })) ?? [];

  return (
    <div className={clsx('space-y-4', className)}>
      {fields.map((field, idx) => (
        <CollapsibleRow
          key={field.id}
          collapsedContents={
            <div>
              {field.label} ({field.display.type})
            </div>
          }
          onRemove={() => {
            remove(idx);
          }}
          defaultOpen={!field.label}
        >
          <ColumnForm
            key={field.id}
            idx={idx}
            control={control}
            fieldOptions={fieldOptions}
            localRelationOptions={localRelationOptions}
          />
        </CollapsibleRow>
      ))}
      <Button
        onClick={() => {
          append({ display: { type: 'text', modelFieldRef: '' }, label: '' });
        }}
      >
        Add Column
      </Button>
    </div>
  );
}

export default CrudTableColumnsForm;
