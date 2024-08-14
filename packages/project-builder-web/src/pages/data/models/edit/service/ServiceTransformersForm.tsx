import {
  ModelConfig,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  createNewModelTransformerWebConfig,
  modelTransformerWebSpec,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, Dropdown } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { UseFormReturn, useFieldArray } from 'react-hook-form';

import { embeddedRelationTransformerWebConfig } from './ServiceEmbeddedRelationForm';
import { LinkButton } from 'src/components';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  originalModel: ModelConfig;
}

const BUILT_IN_TRANSFORMERS = [
  embeddedRelationTransformerWebConfig,
  createNewModelTransformerWebConfig({
    name: 'password',
    label: 'Password',
    getNewTransformer: () => ({
      id: modelTransformerEntityType.generateNewId(),
      type: 'password',
    }),
    getSummary: () => [
      {
        label: 'Password',
        description: 'Password',
      },
    ],
    pluginId: undefined,
  }),
];

function ServiceEmbeddedRelationsForm({
  className,
  formProps,
  originalModel,
}: Props): JSX.Element {
  const { control } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: `service.transformers`,
  });
  const { pluginContainer, definitionContainer } = useProjectDefinition();

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);

  const addableTransformers = transformerWeb
    .getTransformerWebConfigs(BUILT_IN_TRANSFORMERS)
    .filter((transformer) =>
      transformer.allowNewTransformer
        ? !transformer.allowNewTransformer(definitionContainer)
        : true,
    );

  return (
    <div className={clsx('space-y-4', className)}>
      <h2>Transformers</h2>
      {!fields.length && <div>No transformers</div>}
      {fields.map((field, idx) => {
        const transformerConfig = transformerWeb.getTransformerWebConfig(
          field.type,
          BUILT_IN_TRANSFORMERS,
        );

        const Form = transformerConfig.Form;

        return (
          <div className="flex flex-row items-start space-x-4" key={field.id}>
            <div>
              {Form ? (
                <Form
                  formProps={formProps}
                  name={`service.transformers.${idx}`}
                  originalModel={originalModel}
                  pluginId={transformerConfig.pluginId}
                />
              ) : (
                transformerConfig.label
              )}
            </div>
            <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
          </div>
        );
      })}
      {!!addableTransformers.length && (
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button>Add Transformer</Button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              {addableTransformers.map((transformer) => {
                return (
                  <Dropdown.Item
                    key={transformer.name}
                    onSelect={() => append(transformer.getNewTransformer())}
                  >
                    {transformer.label}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Group>
          </Dropdown.Content>
        </Dropdown>
      )}
    </div>
  );
}

export default ServiceEmbeddedRelationsForm;
