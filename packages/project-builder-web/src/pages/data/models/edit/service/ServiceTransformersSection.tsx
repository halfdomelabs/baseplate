import {
  ModelConfig,
  TransformerConfig,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  createNewModelTransformerWebConfig,
  modelTransformerWebSpec,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dropdown,
  RecordView,
  SectionList,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

import { embeddedRelationTransformerWebConfig } from './ServiceEmbeddedRelationForm';
import { ServiceTransformerDialog } from './ServiceTransformerDialog';
import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
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
    getSummary: () => [],
    pluginId: undefined,
  }),
];

function ServiceTransformerRecord({
  formProps,
  idx,
  onRemove,
  onUpdate,
}: {
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  onUpdate: (transformer: TransformerConfig, idx: number) => void;
  onRemove: (idx: number) => void;
}): JSX.Element {
  const { pluginContainer, definitionContainer } = useProjectDefinition();
  const { control } = formProps;

  const field = useWatch({
    control,
    name: `service.transformers.${idx}`,
  });

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);
  const transformerConfig = transformerWeb.getTransformerWebConfig(
    field.type,
    BUILT_IN_TRANSFORMERS,
  );
  const summary = transformerConfig.getSummary(field, definitionContainer);
  return (
    <RecordView>
      <RecordView.ItemList>
        <RecordView.Item title="Type">
          {transformerConfig.label}
        </RecordView.Item>
        {summary.map((item) => {
          return (
            <RecordView.Item key={item.label} title={item.label}>
              {item.description}
            </RecordView.Item>
          );
        })}
      </RecordView.ItemList>
      <RecordView.Actions>
        {transformerConfig.Form && (
          <ServiceTransformerDialog
            webConfig={transformerConfig}
            transformer={field}
            onUpdate={(transformer) => onUpdate(transformer, idx)}
            asChild
          >
            <Button.WithOnlyIcon icon={MdEdit} title="Edit" />
          </ServiceTransformerDialog>
        )}
        <Button.WithOnlyIcon
          icon={MdDelete}
          onClick={() => onRemove(idx)}
          title="Remove"
        />
      </RecordView.Actions>
    </RecordView>
  );
}

export function ServiceTransformersSection({
  className,
  formProps,
}: Props): JSX.Element | null {
  const { control } = formProps;
  const { fields, remove, append, update } = useFieldArray({
    control,
    name: `service.transformers`,
  });
  const { pluginContainer, definitionContainer } = useProjectDefinition();

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);

  const modelConfig = useEditedModelConfig((model) => model);

  const addableTransformers = transformerWeb
    .getTransformerWebConfigs(BUILT_IN_TRANSFORMERS)
    .filter((transformer) =>
      transformer.allowNewTransformer
        ? transformer.allowNewTransformer(definitionContainer, modelConfig)
        : true,
    );

  const [isNewTransfomerDialogOpen, setIsNewTransformerDialogOpen] =
    useState(false);
  const [addableTransformerIdx, setAddableTransformerIdx] = useState<number>(0);

  return (
    <SectionList.Section className={className}>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>Transformers</SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Transformers are used to operate on the data from the client into the
          shape that the database ORM expects.
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
        {fields.map((field, idx) => (
          <ServiceTransformerRecord
            key={field.id}
            formProps={formProps}
            idx={idx}
            onUpdate={(transformer, idx) => {
              update(idx, transformer);
            }}
            onRemove={(idx) => {
              remove(idx);
            }}
          />
        ))}
        {!!addableTransformers.length && (
          <Dropdown>
            <Dropdown.Trigger asChild>
              <Button.WithIcon icon={MdAdd} variant="secondary" size="sm">
                Add Transformer
              </Button.WithIcon>
            </Dropdown.Trigger>
            <Dropdown.Content>
              <Dropdown.Group>
                {addableTransformers.map((transformer, idx) => {
                  return (
                    <Dropdown.Item
                      key={transformer.name}
                      onSelect={() => {
                        if (transformer.Form) {
                          setAddableTransformerIdx(idx);
                          setIsNewTransformerDialogOpen(true);
                        } else {
                          append(
                            transformer.getNewTransformer(
                              definitionContainer,
                              modelConfig,
                            ),
                          );
                        }
                      }}
                    >
                      {transformer.label}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Group>
            </Dropdown.Content>
          </Dropdown>
        )}
        <ServiceTransformerDialog
          webConfig={addableTransformers[addableTransformerIdx]}
          transformer={addableTransformers[
            addableTransformerIdx
          ]?.getNewTransformer(definitionContainer, modelConfig)}
          onUpdate={(transformer) => {
            append(transformer);
          }}
          open={isNewTransfomerDialogOpen}
          onOpenChange={setIsNewTransformerDialogOpen}
        />
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
