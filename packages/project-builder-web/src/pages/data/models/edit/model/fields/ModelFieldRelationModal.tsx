import {
  ModelConfig,
  ModelRelationFieldConfig,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Dialog, toast } from '@halfdomelabs/ui-components';
import { Control, useController, useWatch } from 'react-hook-form';

import {
  ModelFieldRelationForm,
  ModelFieldRelationFormValues,
} from './ModelFieldRelationForm';

interface ModalRelationsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  control: Control<ModelConfig>;
  fieldIdx: number;
}

export function ModalRelationsModal({
  isOpen,
  onClose,
  fieldIdx,
  control,
}: ModalRelationsModalProps): JSX.Element {
  const watchedField = useWatch({
    name: `model.fields.${fieldIdx}`,
    control,
  });
  const modelName = useWatch({
    name: 'name',
    control,
  });

  const {
    field: { value = [], onChange },
  } = useController({
    name: `model.relations`,
    control,
  });

  const modelFieldRelation = value.find(
    (r) =>
      r.references.length === 1 && r.references[0].local === watchedField.id,
  );

  const handleSave = (relation: ModelFieldRelationFormValues): void => {
    if (relation.name === watchedField.name) {
      toast.error('The relation name cannot be the same as the field name');
      return;
    }

    const newRelation: ModelRelationFieldConfig = {
      ...modelFieldRelation,
      id:
        modelFieldRelation?.id ?? modelLocalRelationEntityType.generateNewId(),
      foreignId:
        modelFieldRelation?.foreignId ??
        modelForeignRelationEntityType.generateNewId(),
      name: relation.name,
      references: [
        { local: watchedField.id, foreign: relation.foreignFieldName },
      ],
      modelName: relation.modelName,
      foreignRelationName: relation.foreignRelationName,
      onDelete: relation.onDelete,
      onUpdate: 'Restrict',
    };

    if (modelFieldRelation) {
      onChange(
        value.map((r) => (r.id === modelFieldRelation.id ? newRelation : r)),
      );
    } else {
      onChange([...value, newRelation]);
    }
    onClose();
  };

  const handleDelete = (): void => {
    if (modelFieldRelation) {
      onChange(value.filter((r) => r.id !== modelFieldRelation.id));
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <ModelFieldRelationForm
          existingRelation={modelFieldRelation}
          modelName={modelName}
          localScalarField={watchedField}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={onClose}
        />
      </Dialog.Content>
    </Dialog>
  );
}
