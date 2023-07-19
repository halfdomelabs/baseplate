import {
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  REFERENTIAL_ACTIONS,
  VALIDATORS,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ComboboxInput,
  Dialog,
  SelectInput,
  TextInput,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { pluralize } from 'inflection';
import { camelCase } from 'lodash';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

const modelFieldRelationSchema = z.object({
  name: VALIDATORS.CAMEL_CASE_STRING,
  modelName: z.string().min(1),
  foreignRelationName: VALIDATORS.CAMEL_CASE_STRING,
  foreignFieldName: z.string().min(1),
  onDelete: z.enum(REFERENTIAL_ACTIONS),
});

export type ModelFieldRelationFormValues = z.infer<
  typeof modelFieldRelationSchema
>;

interface ModelFieldRelationFormProps {
  existingRelation?: ModelRelationFieldConfig;
  modelName: string;
  localScalarField: ModelScalarFieldConfig;
  onSave: (relation: ModelFieldRelationFormValues) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

export function ModelFieldRelationForm({
  existingRelation,
  modelName,
  localScalarField,
  onSave,
  onClose,
  onDelete,
}: ModelFieldRelationFormProps): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const foreignModelOptions = parsedProject.getModels().map((type) => ({
    label: type.name,
    value: type.name,
  }));

  const defaultRelationName = localScalarField.name.endsWith('Id')
    ? localScalarField.name.replace(/Id$/, '')
    : '';
  const defaultForeignModel =
    defaultRelationName &&
    foreignModelOptions.find((m) =>
      m.value.toLowerCase().includes(defaultRelationName.toLowerCase())
    )?.value;
  const defaultForeignField =
    defaultForeignModel &&
    parsedProject
      .getModelByName(defaultForeignModel)
      .model.fields.find((f) => f.isId)?.name;

  const { handleSubmit, control, watch, setValue } =
    useForm<ModelFieldRelationFormValues>({
      defaultValues: existingRelation
        ? {
            ...existingRelation,
            foreignFieldName: existingRelation?.references[0].foreign || '',
          }
        : {
            name: defaultRelationName || '',
            modelName: defaultForeignModel || '',
            foreignFieldName: defaultForeignField || '',
            foreignRelationName: defaultRelationName
              ? camelCase(pluralize(modelName))
              : '',
            onDelete: 'Cascade',
          },
      resolver: zodResolver(modelFieldRelationSchema),
    });

  const foreignModelName = watch('modelName');

  const foreignFields = parsedProject
    .getModels()
    .find((m) => m.name === foreignModelName);
  const foreignFieldOptions =
    foreignFields?.model.fields
      .filter((f) => f.type === localScalarField.type)
      .map((f) => ({
        label: f.name,
        value: f.name,
      })) || [];

  const formId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        return handleSubmit(onSave)(e);
      }}
      id={formId}
    >
      <Dialog.Header onClose={onClose}>
        {existingRelation ? 'Edit Relation' : 'Add Relation'}
      </Dialog.Header>
      <Dialog.Body className="space-y-4">
        <ComboboxInput.Controller
          control={control}
          name="modelName"
          options={foreignModelOptions}
          label="Foreign Model"
          description="The model to link the relation to"
          onChange={(newValue) => {
            if (!newValue) {
              return;
            }
            const newForeignField = parsedProject
              .getModelByName(newValue)
              .model.fields.find((f) => f.isId)?.name;
            setValue('foreignFieldName', newForeignField || '');
          }}
        />
        <ComboboxInput.Controller
          control={control}
          name="foreignFieldName"
          options={foreignFieldOptions}
          label="Foreign Field"
          description="The field on the foreign model to link this field to (note: the type of the field must match)"
        />
        <TextInput.Controller
          control={control}
          name="name"
          label="Local Relation Name"
          description={
            <span>
              The name of the relation from current model, e.g. post.
              <strong>user</strong>
            </span>
          }
        />
        <TextInput.Controller
          control={control}
          name="foreignRelationName"
          label="Foreign Relation Name"
          description={
            <span>
              The name of the relation from foreign model, e.g. user.
              <strong>posts</strong>
            </span>
          }
        />
        <SelectInput.Controller
          label="On Delete"
          control={control}
          options={[
            { label: 'Cascade (delete entire local row)', value: 'Cascade' },
            { label: 'Restrict (throw error)', value: 'Restrict' },
            ...(localScalarField.isOptional
              ? [
                  {
                    label: 'Set Null (set local field to null)',
                    value: 'SetNull',
                  },
                ]
              : []),
          ]}
          name="onDelete"
          description="The action to take when the corresponding row in the foreign model is deleted"
        />
      </Dialog.Body>
      <Dialog.Footer className="justify-between">
        {existingRelation ? (
          <Button variant="secondary" onClick={onDelete}>
            Delete Relation
          </Button>
        ) : (
          <div />
        )}
        <div className="flex space-x-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button formId={formId} type="submit">
            Save
          </Button>
        </div>
      </Dialog.Footer>
    </form>
  );
}
