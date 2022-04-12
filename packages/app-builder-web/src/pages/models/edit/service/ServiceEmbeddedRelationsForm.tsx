import { ModelConfig } from '@baseplate/app-builder-lib';
import classNames from 'classnames';
import { useMemo } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Button } from 'src/components';
import { useAppConfig } from 'src/hooks/useAppConfig';
import ServiceEmbeddedRelationForm from './ServiceEmbeddedRelationForm';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  originalModel: ModelConfig;
}

function ServiceEmbeddedRelationsForm({
  className,
  formProps,
  originalModel,
}: Props): JSX.Element {
  const { control } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: `service.embeddedRelations`,
  });

  const { parsedApp } = useAppConfig();

  const foreignRelations = useMemo(
    () =>
      parsedApp.getModels().flatMap(
        (model) =>
          model.model.relations
            ?.filter((relation) => relation.modelName === originalModel.name)
            .map((relation) => ({
              model,
              relation,
            })) || []
      ),
    [parsedApp, originalModel]
  );
  return (
    <div className={classNames('space-y-4', className)}>
      <h2>Embedded Relations</h2>
      {!fields.length && <div>No embedded relations</div>}
      {fields.map((field, idx) => (
        <ServiceEmbeddedRelationForm
          key={field.id}
          formProps={formProps}
          relations={foreignRelations}
          onRemove={() => remove(idx)}
          idx={idx}
        />
      ))}
      <Button onClick={() => append({})}>Add Embedded Relation</Button>
    </div>
  );
}

export default ServiceEmbeddedRelationsForm;
