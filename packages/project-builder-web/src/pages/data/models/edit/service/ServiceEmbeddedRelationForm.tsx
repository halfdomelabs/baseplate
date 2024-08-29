import {
  EmbeddedRelationTransformerConfig,
  ModelTransformerUtils,
  ModelUtils,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  ModelTransformerWebConfig,
  ModelTransformerWebFormProps,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { MultiComboboxField, SelectField } from '@halfdomelabs/ui-components';
import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';

import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';
import { usePrevious } from 'src/hooks/usePrevious';

function ServiceEmbeddedRelationForm({
  formProps,
  name,
}: ModelTransformerWebFormProps): JSX.Element {
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
    name: `${prefix}`,
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
    return relationsToModel.filter(({ relation }) => {
      return !otherEmbeddedRelations?.some(
        (o) => o.foreignRelationRef === relation.foreignId,
      );
    });
  });

  const relationOptions = availableRelations.map((relation) => ({
    label: `${relation.relation.foreignRelationName} (${relation.model.name})`,
    value: relation.relation.foreignId,
  }));

  const embeddedTransformer =
    transformer?.type === 'embeddedRelation' ? transformer : null;
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
        setValue(`${prefix}.modelRef`, relation?.model.id);
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
            (reference) => reference.local === field.id,
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
        disabled={!foreignFieldOptions.length}
        options={foreignFieldOptions}
        name={`${prefix}.embeddedFieldNames`}
        label="Embedded Field Names"
      />
      {!!foreignTransformerOptions.length && (
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
      return relationsToModel.some(({ relation }) => {
        return !otherEmbeddedRelations?.some(
          (o) => o.foreignRelationRef === relation.foreignId,
        );
      });
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
