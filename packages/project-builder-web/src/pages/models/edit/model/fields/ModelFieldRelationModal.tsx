import {
  ModelConfig,
  ModelRelationFieldConfig,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { Dialog } from '@halfdomelabs/ui-components';
import { Control, useController, useWatch } from 'react-hook-form';

import {
  ModelFieldRelationForm,
  ModelFieldRelationFormValues,
} from './ModelFieldRelationForm';
import { useToast } from 'src/hooks/useToast';

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
  const toast = useToast();
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
      r.references.length === 1 &&
      r.references[0].local.includes(watchedField.name)
  );

  const handleSave = (relation: ModelFieldRelationFormValues): void => {
    if (relation.name === watchedField.name) {
      toast.error('The relation name cannot be the same as the field name');
      return;
    }

    const needsRelationshipName = value.some(
      (r) => r.uid !== modelFieldRelation?.uid && r.modelName === relation.name
    );

    const newRelation: ModelRelationFieldConfig = {
      ...modelFieldRelation,
      uid: modelFieldRelation?.uid || randomUid(),
      name: relation.name,
      references: [
        { local: watchedField.name, foreign: relation.foreignFieldName },
      ],
      modelName: relation.modelName,
      foreignRelationName: relation.foreignRelationName,
      relationshipName: needsRelationshipName
        ? relation.foreignRelationName
        : undefined,
      relationshipType: watchedField.isUnique ? 'oneToOne' : 'oneToMany',
      isOptional: watchedField.isOptional || false,
      onDelete: relation.onDelete,
      onUpdate: 'Restrict',
    };

    if (modelFieldRelation) {
      onChange(
        value.map((r) => (r.uid === modelFieldRelation.uid ? newRelation : r))
      );
    } else {
      onChange([...value, newRelation]);
    }

    // add relationship name to all other relations
    if (needsRelationshipName) {
      onChange(
        value.map((r) =>
          r.modelName === relation.modelName
            ? {
                ...r,
                relationshipName: relation.foreignRelationName,
              }
            : r
        )
      );
    }
    onClose();
  };

  const handleDelete = (): void => {
    if (modelFieldRelation) {
      onChange(value.filter((r) => r.uid !== modelFieldRelation.uid));
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
