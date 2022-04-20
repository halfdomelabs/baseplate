import {
  ModelConfig,
  ModelScalarFieldConfig,
  SCALAR_FIELD_TYPES,
} from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import {
  FieldArrayWithId,
  useController,
  UseFormReturn,
} from 'react-hook-form';
import { LinkButton, SelectInput, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.fields', 'id'>;
  onRemove: (idx: number) => void;
  originalModel?: ModelConfig;
}

function formatFieldAttributes(field: ModelScalarFieldConfig): string {
  const attrStrings: string[] = [];
  const { options = {} } = field;
  if (field.isId) attrStrings.push('id');
  if (field.isOptional) attrStrings.push('optional');
  if (field.isUnique) attrStrings.push('unique');
  if (options.defaultToNow) attrStrings.push('defaultToNow');
  if (options.genUuid) attrStrings.push('genUuid');
  if (options.updatedAt) attrStrings.push('updatedAt');
  return attrStrings.join(', ');
}

function ModelFieldForm({
  className,
  formProps,
  idx,
  field,
  onRemove,
  originalModel,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = formProps;

  const watchedField = watch(`model.fields.${idx}`);

  const watchedRelations = watch(`model.relations`);
  const watchedPrimaryKeys = watch(`model.primaryKeys`);
  const watchedUniqueConstraints = watch(`model.uniqueConstraints`);

  const typeOptions = SCALAR_FIELD_TYPES.map((type) => ({
    label: type,
    value: type,
  }));

  const attrString = formatFieldAttributes(watchedField);

  const { parsedProject } = useProjectConfig();
  const toast = useToast();

  function handleRemove(): void {
    // check for references
    if (originalModel) {
      const originalField = originalModel.model.fields.find(
        (f) => f.uid === watchedField.uid
      );
      if (originalField) {
        const references = parsedProject.references.modelField?.[
          `${originalModel.name}.${originalField.name}`
        ]?.filter(
          (ref) =>
            ref.referenceName !== 'modelPrimaryKey' &&
            ref.referenceName !== 'modelLocalRelation'
        );
        if (references?.length) {
          toast.error(
            `Unable to remove field ${
              originalField.name
            } as it is being used in ${references
              .map((r) => r.path)
              .join(', ')}`
          );
          return;
        }
      }
    }
    // check local references
    const usedRelations = watchedRelations?.filter((relation) =>
      relation.references.some((r) => r.local.includes(watchedField.name))
    );
    if (usedRelations?.length) {
      toast.error(
        `Unable to remove field as it is being used in relations ${usedRelations
          .map((r) => r.name)
          .join(', ')}`
      );
      return;
    }

    // check primary keys
    if (watchedPrimaryKeys?.includes(watchedField.name)) {
      toast.error(
        `Unable to remove field as it is being used in in the primary key`
      );
      return;
    }

    // check unique constraints
    if (
      watchedUniqueConstraints?.some(
        (constraint) => constraint.name === watchedField.name
      )
    ) {
      toast.error(
        `Unable to remove field as it is being used in in a unique constraint`
      );
      return;
    }

    onRemove(idx);
  }

  const { field: nameField } = useController({
    control,
    name: `model.fields.${idx}.name`,
  });

  const handleNameChange = (name: string): void => {
    // update local references
    watchedRelations?.forEach((relation, relationIdx) => {
      relation.references.forEach((reference, referenceIdx) => {
        if (reference.local.includes(watchedField.name)) {
          formProps.setValue(
            `model.relations.${relationIdx}.references.${referenceIdx}.local`,
            name
          );
        }
      });
    });
    watchedPrimaryKeys?.forEach((primaryKey, primaryKeyIdx) => {
      if (primaryKey === watchedField.name) {
        formProps.setValue(`model.primaryKeys.${primaryKeyIdx}`, name);
      }
    });
    watchedUniqueConstraints?.forEach((constraint, constraintIdx) => {
      if (constraint.name === watchedField.name) {
        formProps.setValue(
          `model.uniqueConstraints.${constraintIdx}.name`,
          name
        );
      }
    });
    nameField.onChange(name);
  };

  return (
    <div className={classNames('space-y-4 min-w-[400px] w-1/2', className)}>
      {!isOpen ? (
        <div className="flex flex-row space-x-4 items-center">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{watchedField.name}</strong> ({watchedField.type})
            {attrString && `: ${attrString}`}
          </div>
          <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200">
          <div className="space-x-4 flex flex-row">
            <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
            <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
          </div>
          <TextInput.Labelled
            label="Name"
            className="w-full"
            onChange={handleNameChange}
            onBlur={nameField.onBlur}
            value={nameField.value}
            error={errors.model?.fields?.[idx].name?.message}
          />
          <SelectInput.Labelled
            label="Type"
            options={typeOptions}
            register={register(`model.fields.${idx}.type`)}
            error={errors.model?.fields?.[idx].name?.message}
          />
          <div className="flex flex-row space-x-4">
            <CheckedInput.Labelled
              label="ID"
              register={register(`model.fields.${idx}.isId`)}
              error={errors.model?.fields?.[idx].isId?.message}
            />
            <CheckedInput.Labelled
              label="Optional"
              register={register(`model.fields.${idx}.isOptional`)}
              error={errors.model?.fields?.[idx].isOptional?.message}
            />
            <CheckedInput.Labelled
              label="Unique"
              register={register(`model.fields.${idx}.isUnique`)}
              error={errors.model?.fields?.[idx].isUnique?.message}
            />
            {field.type === 'uuid' && (
              <CheckedInput.Labelled
                label="Auto-Generate UUID"
                register={register(`model.fields.${idx}.options.genUuid`)}
                error={errors.model?.fields?.[idx].options?.genUuid?.message}
              />
            )}
            {field.type === 'dateTime' && (
              <>
                <CheckedInput.Labelled
                  label="Default to Now"
                  register={register(
                    `model.fields.${idx}.options.defaultToNow`
                  )}
                  error={
                    errors.model?.fields?.[idx].options?.defaultToNow?.message
                  }
                />
                <CheckedInput.Labelled
                  label="Updated At"
                  register={register(`model.fields.${idx}.options.updatedAt`)}
                  error={
                    errors.model?.fields?.[idx].options?.updatedAt?.message
                  }
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelFieldForm;
