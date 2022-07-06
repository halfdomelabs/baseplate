import { ModelConfig } from '@baseplate/project-builder-lib';
import { Control } from 'react-hook-form';
import { LinkButton, SelectInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface Props {
  control: Control<ModelConfig>;
  idx: number;
  onRemove: () => void;
  originalModel: ModelConfig;
}

function ServiceFileTransformerForm({
  control,
  idx,
  onRemove,
  originalModel,
}: Props): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const fileRelations =
    originalModel.model.relations?.filter(
      (relation) =>
        relation.modelName === parsedProject.projectConfig.storage?.fileModel
    ) || [];

  const relationOptions = fileRelations.map((relation) => ({
    label: relation.name,
    value: relation.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <div>
          <strong>File Transformer</strong>
        </div>
        <LinkButton onClick={onRemove}>Remove</LinkButton>
      </div>
      <SelectInput.LabelledController
        className="w-full"
        control={control}
        label="Relation"
        name={`service.transformers.${idx}.name`}
        options={relationOptions}
      />
    </div>
  );
}

export default ServiceFileTransformerForm;
