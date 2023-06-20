import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Button, TextInput, ToggleInput } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { Control, useWatch } from 'react-hook-form';
import { HiOutlineTrash } from 'react-icons/hi';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { ModelFieldDefaultValueInput } from './ModelFieldDefaultValueInput';
import { ModelFieldTypeInput } from './ModelFieldTypeInput';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
  idx: number;
  onRemove: (idx: number) => void;
  originalModel?: ModelConfig;
  fixReferences: () => void;
}

function ModelFieldForm({
  className,
  control,
  idx,
  onRemove,
  originalModel,
  fixReferences,
}: Props): JSX.Element {
  const watchedField = useWatch({
    name: `model.fields.${idx}`,
    control,
  });

  const watchedRelations = useWatch({
    name: `model.relations`,
    control,
  });

  const watchedPrimaryKeys = useWatch({
    name: `model.primaryKeys`,
    control,
  });

  const watchedUniqueConstraints = useWatch({
    name: `model.uniqueConstraints`,
    control,
  });

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
            ref.referenceType !== 'modelPrimaryKey' &&
            ref.referenceType !== 'modelLocalRelation'
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
      relation.references.some(
        (r) => watchedField.name && r.local.includes(watchedField.name)
      )
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

  return (
    <tr className={clsx(className)}>
      <td>
        <TextInput.Controller
          control={control}
          name={`model.fields.${idx}.name`}
          onBlur={() => fixReferences()}
        />
      </td>
      <td>
        <ModelFieldTypeInput control={control} idx={idx} />
      </td>
      <td>
        <ModelFieldDefaultValueInput control={control} idx={idx} />
      </td>
      <td>
        <ToggleInput.Controller
          control={control}
          name={`model.fields.${idx}.isId`}
        />
      </td>
      <td>
        <ToggleInput.Controller
          control={control}
          name={`model.fields.${idx}.isOptional`}
        />
      </td>
      <td>
        <ToggleInput.Controller
          control={control}
          name={`model.fields.${idx}.isUnique`}
        />
      </td>
      <td>
        <Button
          variant="tertiary"
          iconBefore={HiOutlineTrash}
          onClick={() => handleRemove()}
          size="icon"
        />
      </td>
    </tr>
  );
}

export default ModelFieldForm;
