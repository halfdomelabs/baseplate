import {
  ModelConfig,
  ModelRelationFieldConfig,
} from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { LinkButton, SelectInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import { usePrevious } from 'src/hooks/usePrevious';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  relations: { model: ModelConfig; relation: ModelRelationFieldConfig }[];
  idx: number;
  onRemove: () => void;
}

function ServiceEmbeddedRelationForm({
  className,
  formProps,
  relations,
  idx,
  onRemove,
}: Props): JSX.Element {
  const { control, setValue } = formProps;

  const embeddedRelations = useWatch({
    control,
    name: 'service.embeddedRelations',
  });

  const relationOptions = relations.map((relation) => ({
    label: `${relation.relation.foreignFieldName} (${relation.model.name})`,
    value: relation.relation.foreignFieldName,
  }));

  const embeddedRelation = embeddedRelations?.[idx];

  const selectedRelation = relations.find(
    (relation) =>
      relation.relation.foreignFieldName === embeddedRelation?.localRelationName
  );

  const selectedLocalRelationName = useWatch({
    control,
    name: `service.embeddedRelations.${idx}.localRelationName`,
  });

  const previousLocalRelationName = usePrevious(selectedLocalRelationName);
  useEffect(() => {
    if (
      previousLocalRelationName !== undefined &&
      previousLocalRelationName !== selectedLocalRelationName
    ) {
      setValue(`service.embeddedRelations.${idx}.embeddedFieldNames`, []);
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
      })) || [];

  return (
    <div className={classNames('space-y-4', className)}>
      <SelectInput.LabelledController
        className="w-full"
        control={control}
        name={`service.embeddedRelations.${idx}.localRelationName`}
        options={relationOptions}
        label="Relation"
      />
      <CheckedArrayInput.LabelledController
        className="w-full"
        control={control}
        options={foreignFieldOptions}
        name={`service.embeddedRelations.${idx}.embeddedFieldNames`}
        label="Embedded Field Names"
      />
      <LinkButton onClick={onRemove}>Remove</LinkButton>
    </div>
  );
}

export default ServiceEmbeddedRelationForm;
