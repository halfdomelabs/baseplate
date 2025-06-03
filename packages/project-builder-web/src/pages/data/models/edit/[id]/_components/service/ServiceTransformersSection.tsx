import type {
  ModelConfigInput,
  TransformerConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  modelTransformerWebSpec,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdAdd, MdEdit, MdOutlineDelete } from 'react-icons/md';

import { BUILT_IN_TRANSFORMER_WEB_CONFIGS } from '#src/pages/data/models/_constants.js';
import { useEditedModelConfig } from '#src/pages/data/models/_hooks/useEditedModelConfig.js';

import { ServiceTransformerDialog } from './ServiceTransformerDialog.js';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfigInput>;
}

function ServiceTransformerRecord({
  formProps,
  idx,
  onRemove,
  onUpdate,
}: {
  formProps: UseFormReturn<ModelConfigInput>;
  idx: number;
  onUpdate: (transformer: TransformerConfig, idx: number) => void;
  onRemove: (idx: number) => void;
}): React.JSX.Element {
  const { pluginContainer, definitionContainer } = useProjectDefinition();
  const { control } = formProps;

  const field = useWatch({
    control,
    name: `service.transformers.${idx}`,
  });

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);
  const transformerConfig = transformerWeb.getTransformerWebConfig(
    field.type,
    BUILT_IN_TRANSFORMER_WEB_CONFIGS,
  );
  const summary = transformerConfig.getSummary(field, definitionContainer);
  return (
    <RecordView>
      <RecordViewItemList>
        <RecordViewItem title="Type">{transformerConfig.label}</RecordViewItem>
        {summary.map((item) => (
          <RecordViewItem key={item.label} title={item.label}>
            {item.description}
          </RecordViewItem>
        ))}
      </RecordViewItemList>
      <RecordViewActions>
        {transformerConfig.Form && (
          <ServiceTransformerDialog
            webConfig={transformerConfig}
            transformer={field}
            onUpdate={(transformer) => {
              onUpdate(transformer, idx);
            }}
            asChild
            isCreate={false}
          >
            <Button variant="ghost" size="icon" title="Edit">
              <MdEdit />
            </Button>
          </ServiceTransformerDialog>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onRemove(idx);
          }}
          title="Remove"
          className="text-destructive hover:text-destructive-hover"
        >
          <MdOutlineDelete />
        </Button>
      </RecordViewActions>
    </RecordView>
  );
}

export function ServiceTransformersSection({
  className,
  formProps,
}: Props): React.JSX.Element | null {
  const { control } = formProps;
  const { fields, remove, append, update } = useFieldArray({
    control,
    name: `service.transformers`,
  });
  const { pluginContainer, definitionContainer } = useProjectDefinition();

  const { requestConfirm } = useConfirmDialog();

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);

  const modelConfig = useEditedModelConfig((model) => model);

  const addableTransformers = transformerWeb
    .getTransformerWebConfigs(BUILT_IN_TRANSFORMER_WEB_CONFIGS)
    .filter((transformer) =>
      transformer.allowNewTransformer
        ? transformer.allowNewTransformer(definitionContainer, modelConfig)
        : true,
    );

  const [isNewTransfomerDialogOpen, setIsNewTransformerDialogOpen] =
    useState(false);
  const [addableTransformerIdx, setAddableTransformerIdx] = useState<number>(0);

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Transformers</SectionListSectionTitle>
        <SectionListSectionDescription>
          Transformers are used to operate on the data from the client into the
          shape that the database ORM expects.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="max-w-xl space-y-4">
        {fields.map((field, idx) => (
          <ServiceTransformerRecord
            key={field.id}
            formProps={formProps}
            idx={idx}
            onUpdate={(transformer, idx) => {
              update(idx, transformer);
            }}
            onRemove={(idx) => {
              requestConfirm({
                title: 'Confirm delete',
                content: `Are you sure you want to delete this transformer?`,
                buttonConfirmText: 'Delete',
                buttonConfirmVariant: 'destructive',
                onConfirm: () => {
                  remove(idx);
                },
              });
            }}
          />
        ))}
        {addableTransformers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <MdAdd />
                Add Transformer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {addableTransformers.map((transformer, idx) => (
                  <DropdownMenuItem
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
                    <div className="flex flex-col gap-1">
                      <div>{transformer.label}</div>
                      <div className="text-style-muted">
                        {transformer.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
          isCreate={true}
        />
      </SectionListSectionContent>
    </SectionListSection>
  );
}
