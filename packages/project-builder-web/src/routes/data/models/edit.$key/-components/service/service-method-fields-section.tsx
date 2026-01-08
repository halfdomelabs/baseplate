import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { ModelTransformerUtils } from '@baseplate-dev/project-builder-lib';
import {
  modelTransformerWebSpec,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchField,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';

import {
  BUILT_IN_TRANSFORMER_WEB_CONFIGS,
  SCALAR_FIELD_TYPE_OPTIONS,
} from '../../../-constants.js';
import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';
import { BadgeWithTypeLabel } from '../badge-with-type-label.js';

interface ServiceMethodFieldsSectionProps {
  className?: string;
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
}

export function ServiceMethodFieldsSection({
  className,
  control,
  setValue,
}: ServiceMethodFieldsSectionProps): React.JSX.Element | null {
  const fields = useEditedModelConfig((model) => model.model.fields);
  const create = useWatch({ control, name: 'service.create' });
  const update = useWatch({ control, name: 'service.update' });
  const isCreateEnabled = create?.enabled;
  const isUpdateEnabled = update?.enabled;
  const transformers =
    useWatch({ control, name: 'service.transformers' }) ?? [];
  const { definitionContainer, pluginContainer } = useProjectDefinition();

  if (!isCreateEnabled && !isUpdateEnabled) {
    return null;
  }

  const createFields = create?.fields ?? [];
  const updateFields = update?.fields ?? [];

  const createTransformers = create?.transformerNames ?? [];
  const updateTransformers = update?.transformerNames ?? [];

  const tableClassName =
    'w-full border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10 [&_th]:py-2';

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>
          Create / Update Fields
        </SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure the fields that can be created or updated by the service
          method
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="max-w-xl space-y-4">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className="w-full">
                <Label>Fields</Label>
              </th>
              {isCreateEnabled && <th className="pl-8">Create</th>}
              {isUpdateEnabled && <th className="pl-8">Update</th>}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id}>
                <td>
                  <BadgeWithTypeLabel
                    type={
                      field.type === 'enum' && field.options?.enumRef
                        ? definitionContainer.nameFromId(field.options.enumRef)
                        : SCALAR_FIELD_TYPE_OPTIONS[field.type].label
                    }
                  >
                    {field.name}
                  </BadgeWithTypeLabel>
                </td>
                {isCreateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={createFields.includes(field.id)}
                      onChange={(value) => {
                        setValue(
                          'service.create.fields',
                          value
                            ? [...createFields, field.id]
                            : createFields.filter((id) => id !== field.id),
                          { shouldDirty: true },
                        );
                      }}
                    />
                  </td>
                )}
                {isUpdateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={updateFields.includes(field.id)}
                      onChange={(value) => {
                        setValue(
                          'service.update.fields',
                          value
                            ? [...updateFields, field.id]
                            : updateFields.filter((id) => id !== field.id),
                          { shouldDirty: true },
                        );
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {transformers.length > 0 && (
              <tr>
                <th>
                  <Label>Transformers</Label>
                </th>
              </tr>
            )}
            {transformers.map((transformer) => (
              <tr key={transformer.id}>
                <td>
                  <BadgeWithTypeLabel
                    type={
                      transformerWeb.getTransformerWebConfig(
                        transformer.type,
                        BUILT_IN_TRANSFORMER_WEB_CONFIGS,
                      ).label
                    }
                  >
                    {ModelTransformerUtils.getTransformerName(
                      definitionContainer,
                      transformer,
                      pluginContainer,
                    )}
                  </BadgeWithTypeLabel>
                </td>
                {isCreateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={createTransformers.includes(transformer.id)}
                      onChange={(value) => {
                        setValue(
                          'service.create.transformerNames',
                          value
                            ? [...createTransformers, transformer.id]
                            : createTransformers.filter(
                                (id) => id !== transformer.id,
                              ),
                          { shouldDirty: true },
                        );
                      }}
                    />
                  </td>
                )}
                {isUpdateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={updateTransformers.includes(transformer.id)}
                      onChange={(value) => {
                        setValue(
                          'service.update.transformerNames',
                          value
                            ? [...updateTransformers, transformer.id]
                            : updateTransformers.filter(
                                (id) => id !== transformer.id,
                              ),
                          { shouldDirty: true },
                        );
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
