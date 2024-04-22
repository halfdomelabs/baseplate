import {
  EmbeddedRelationTransformerConfig,
  ModelConfig,
  ModelTransformerUtils,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

import { useEditedModelConfig } from '../hooks/useEditedModelConfig';
import { LinkButton, SelectInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import { usePrevious } from 'src/hooks/usePrevious';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  onRemove: () => void;
}

function ServiceEmbeddedRelationForm({
  className,
  formProps,
  idx,
  onRemove,
}: Props): JSX.Element {
  const { control, setValue } = formProps;

  const { config, definitionContainer } = useProjectDefinition();

  const availableRelations = useEditedModelConfig((model) => {
    const relationsToModel = ModelUtils.getRelationsToModel(config, model.id);
    const otherEmbeddedRelations = model.service?.transformers?.filter(
      (t, transformerIdx): t is EmbeddedRelationTransformerConfig =>
        t.type === 'embeddedRelation' && idx !== transformerIdx,
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

  const transformer = useWatch({
    control,
    name: `service.transformers.${idx}`,
  });

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
      setValue(`service.transformers.${idx}.embeddedFieldNames`, []);
      if (relation?.model.id) {
        setValue(`service.transformers.${idx}.modelRef`, relation?.model.id);
      }
    }
  }, [
    idx,
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
      ),
      value: transformer.id,
    })) ?? [];

  return (
    <div className={classNames('space-y-4', className)}>
      <SelectInput.LabelledController
        className="w-full"
        control={control}
        name={`service.transformers.${idx}.foreignRelationRef`}
        options={relationOptions}
        label="Relation"
      />
      <CheckedArrayInput.LabelledController
        className="w-full"
        control={control}
        options={foreignFieldOptions}
        name={`service.transformers.${idx}.embeddedFieldNames`}
        label="Embedded Field Names"
      />
      {!!foreignTransformerOptions.length && (
        <CheckedArrayInput.LabelledController
          className="w-full"
          control={control}
          options={foreignTransformerOptions}
          name={`service.transformers.${idx}.embeddedTransformerNames`}
          label="Embedded Transformers"
        />
      )}
      <LinkButton onClick={onRemove}>Remove</LinkButton>
    </div>
  );
}

export default ServiceEmbeddedRelationForm;
