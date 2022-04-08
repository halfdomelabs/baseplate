import {
  ModelConfig,
  ModelScalarFieldConfig,
  SCALAR_FIELD_TYPES,
} from '@baseplate/app-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { FieldArrayWithId, UseFormReturn } from 'react-hook-form';
import { LinkButton, SelectInput, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.fields', 'id'>;
  onRemove: (idx: number) => void;
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
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);
  const {
    register,
    watch,
    formState: { errors },
  } = formProps;

  const watchedField = watch(`model.fields.${idx}`);

  const typeOptions = SCALAR_FIELD_TYPES.map((type) => ({
    label: type,
    value: type,
  }));

  const attrString = formatFieldAttributes(watchedField);

  return (
    <div className={classNames('space-y-4 min-w-[400px] w-1/2', className)}>
      {!isOpen ? (
        <div className="flex flex-row space-x-4 items-center">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{watchedField.name}</strong> ({watchedField.type})
            {attrString && `: ${attrString}`}
          </div>
          <LinkButton onClick={() => onRemove(idx)}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200 p-4">
          <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
          <TextInput.Labelled
            label="Name"
            className="w-full"
            register={register(`model.fields.${idx}.name`)}
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
