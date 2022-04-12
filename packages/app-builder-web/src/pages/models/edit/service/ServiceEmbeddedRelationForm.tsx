import {
  ModelConfig,
  ModelRelationFieldConfig,
} from '@baseplate/app-builder-lib';
import classNames from 'classnames';
import { UseFormReturn } from 'react-hook-form';
import { LinkButton, SelectInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';

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
  const { control, watch } = formProps;

  const embeddedRelations = watch('service.embeddedRelations');

  const relationOptions = relations.map((relation) => ({
    label: `${relation.relation.foreignFieldName} (${relation.model.name})`,
    value: relation.relation.foreignFieldName,
  }));

  const embeddedRelation = embeddedRelations?.[idx];

  const selectedRelation = relations.find(
    (relation) =>
      relation.relation.foreignFieldName === embeddedRelation?.localRelationName
  );
  const foreignFieldOptions =
    selectedRelation?.model.model.fields.map((field) => ({
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
        label="Embeddded Field Names"
      />
      <LinkButton onClick={onRemove}>Remove</LinkButton>
    </div>
  );
}

export default ServiceEmbeddedRelationForm;
