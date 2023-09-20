import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useEffect, useMemo } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { LinkButton, SelectInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import { usePrevious } from 'src/hooks/usePrevious';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  onRemove: () => void;
  originalModel: ModelConfig;
}

function ServiceEmbeddedRelationForm({
  className,
  formProps,
  idx,
  onRemove,
  originalModel,
}: Props): JSX.Element {
  const { control, setValue } = formProps;

  const { parsedProject } = useProjectConfig();

  const transformers = useWatch({
    control,
    name: 'service.transformers',
  });
  const embeddedRelationTransformers = transformers?.filter(
    (t) => t.type === 'embeddedRelation'
  );

  const selectedTransformer = transformers?.[idx];
  const embeddedRelation =
    selectedTransformer?.type === 'embeddedRelation'
      ? selectedTransformer
      : null;

  const relations = useMemo(
    () =>
      parsedProject.getModels().flatMap(
        (model) =>
          model.model.relations
            ?.filter((relation) => relation.modelName === originalModel.name)
            .filter(
              (relation) =>
                embeddedRelation?.name === relation.foreignRelationName ||
                !embeddedRelationTransformers?.some(
                  (t) => t.name === relation.foreignRelationName
                )
            )
            .map((relation) => ({
              model,
              relation,
            })) ?? []
      ),
    [
      parsedProject,
      originalModel,
      embeddedRelation,
      embeddedRelationTransformers,
    ]
  );

  const relationOptions = relations.map((relation) => ({
    label: `${relation.relation.foreignRelationName} (${relation.model.name})`,
    value: relation.relation.foreignRelationName,
  }));

  const selectedRelation = relations.find(
    (relation) =>
      relation.relation.foreignRelationName === embeddedRelation?.name
  );

  const selectedLocalRelationName = useWatch({
    control,
    name: `service.transformers.${idx}.name`,
  });

  const previousLocalRelationName = usePrevious(selectedLocalRelationName);
  useEffect(() => {
    if (
      previousLocalRelationName !== undefined &&
      previousLocalRelationName !== selectedLocalRelationName
    ) {
      setValue(`service.transformers.${idx}.embeddedFieldNames`, []);
    }
  }, [previousLocalRelationName, selectedLocalRelationName, idx, setValue]);

  const foreignFieldOptions =
    selectedRelation?.model.model.fields
      .filter(
        (field) =>
          !selectedRelation.relation.references.some(
            (reference) => reference.local === field.name
          )
      )
      .map((field) => ({
        label: field.name,
        value: field.name,
      })) ?? [];

  const foreignTransformerOptions =
    selectedRelation?.model.service?.transformers?.map((transformer) => ({
      label: transformer.name,
      value: transformer.name,
    })) ?? [];

  return (
    <div className={classNames('space-y-4', className)}>
      <SelectInput.LabelledController
        className="w-full"
        control={control}
        name={`service.transformers.${idx}.name`}
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
