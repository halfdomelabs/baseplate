import type { EmbeddedRelationTransformerConfig } from '@halfdomelabs/project-builder-lib';
import type {
  ModelTransformerWebConfig,
  ModelTransformerWebFormProps,
} from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  modelTransformerEntityType,
  ModelTransformerUtils,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { MultiComboboxField, SelectField } from '@halfdomelabs/ui-components';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { usePrevious } from 'src/hooks/usePrevious';

import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig';

function ServiceEmbeddedRelationForm({
  formProps,
  name,
}: ModelTransformerWebFormProps): React.JSX.Element {
  // force type cast to avoid TS error
  const prefix = name as 'prefix';
  const formPropsTyped = formProps as unknown as UseFormReturn<{
    prefix: EmbeddedRelationTransformerConfig;
  }>;
  const { control, setValue } = formPropsTyped;

  const { definition, definitionContainer, pluginContainer } =
    useProjectDefinition();

  const transformer = useWatch({
    control,
    name: prefix,
  });

  const availableRelations = useEditedModelConfig((model) => {
    const relationsToModel = ModelUtils.getRelationsToModel(
      definition,
      model.id,
    );
    const otherEmbeddedRelations = model.service?.transformers?.filter(
      (t): t is EmbeddedRelationTransformerConfig =>
        t.type === 'embeddedRelation' && t.id !== transformer.id,
    );
    return relationsToModel.filter(
      ({ relation }) =>
        !otherEmbeddedRelations?.some(
          (o) => o.foreignRelationRef === relation.foreignId,
        ),
    );
  });

  const relationOptions = availableRelations.map((relation) => ({
    label: `${relation.relation.foreignRelationName} (${relation.model.name})`,
    value: relation.relation.foreignId,
  }));

  const embeddedTransformer =
    (transformer.type as string) === 'embeddedRelation' ? transformer : null;
  const relation = availableRelations.find(
    (r) => r.relation.foreignId === embeddedTransformer?.foreignRelationRef,
  );

  const previousForeignModelId = usePrevious(
    embeddedTransformer?.foreignRelationRef,
  );
  useEffect(() => {
    if (
      previousForeignModelId !== undefined &&
      previousForeignModelId !== embeddedTransformer?.foreignRelationRef
    ) {
      setValue(`${prefix}.embeddedFieldNames`, []);
      if (relation?.model.id) {
        setValue(`${prefix}.modelRef`, relation.model.id);
      }
    }
  }, [
    prefix,
    setValue,
    relation,
    embeddedTransformer?.foreignRelationRef,
    previousForeignModelId,
    availableRelations,
  ]);

  const foreignFieldOptions =
    relation?.model.model.fields
      .filter(
        (field) =>
          !relation.relation.references.some(
            (reference) => reference.localRef === field.id,
          ),
      )
      .map((field) => ({
        label: field.name,
        value: field.id,
      })) ?? [];

  const foreignTransformerOptions =
    relation?.model.service?.transformers?.map((transformer) => ({
      label: ModelTransformerUtils.getTransformName(
        definitionContainer,
        transformer,
        pluginContainer,
      ),
      value: transformer.id,
    })) ?? [];

  return (
    <div className={'space-y-4'}>
      <SelectField.Controller
        control={control}
        name={`${prefix}.foreignRelationRef`}
        options={relationOptions}
        label="Relation"
        placeholder="Select relation"
      />
      <MultiComboboxField.Controller
        control={control}
        disabled={foreignFieldOptions.length === 0}
        options={foreignFieldOptions}
        name={`${prefix}.embeddedFieldNames`}
        label="Embedded Field Names"
      />
      {foreignTransformerOptions.length > 0 && (
        <MultiComboboxField.Controller
          control={control}
          options={foreignTransformerOptions}
          name={`${prefix}.embeddedTransformerNames`}
          label="Embedded Transformers"
        />
      )}
    </div>
  );
}

export const embeddedRelationTransformerWebConfig: ModelTransformerWebConfig<EmbeddedRelationTransformerConfig> =
  {
    name: 'embeddedRelation',
    label: 'Embedded Relation',
    description: 'Upsert records to a related model table',
    instructions: `This transformer allows you to upsert related records to a related model's table
      e.g. UserRole records for a User. It will create, update, delete related records to fit the provided
      input.`,
    getSummary(definition, container) {
      return [
        {
          label: 'Embedded Relation',
          description: container.nameFromId(definition.foreignRelationRef),
        },
      ];
    },
    allowNewTransformer(projectContainer, model) {
      const { definition } = projectContainer;
      const relationsToModel = ModelUtils.getRelationsToModel(
        definition,
        model.id,
      );
      const otherEmbeddedRelations = model.service?.transformers?.filter(
        (t): t is EmbeddedRelationTransformerConfig =>
          t.type === 'embeddedRelation',
      );
      return relationsToModel.some(
        ({ relation }) =>
          !otherEmbeddedRelations?.some(
            (o) => o.foreignRelationRef === relation.foreignId,
          ),
      );
    },
    getNewTransformer: () => ({
      id: modelTransformerEntityType.generateNewId(),
      foreignRelationRef: '',
      type: 'embeddedRelation',
      embeddedFieldNames: [],
      modelRef: '',
    }),
    Form: ServiceEmbeddedRelationForm,
    pluginId: undefined,
  };
