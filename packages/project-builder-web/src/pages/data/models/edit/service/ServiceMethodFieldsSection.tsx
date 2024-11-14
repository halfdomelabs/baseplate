import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { ModelTransformerUtils } from '@halfdomelabs/project-builder-lib';
import {
  modelTransformerWebSpec,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';
import { useWatch } from 'react-hook-form';

import { BUILT_IN_TRANSFORMER_WEB_CONFIGS } from '../../constants/built-in-transformers';
import { SCALAR_FIELD_TYPE_OPTIONS } from '../../constants/scalar-types';
import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';
import { BadgeWithTypeLabel } from '../components/BadgeWithTypeLabel';

interface ServiceMethodFieldsSectionProps {
  className?: string;
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
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
    'border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10 [&_th]:py-2';

  const transformerWeb = pluginContainer.getPluginSpec(modelTransformerWebSpec);

  return (
    <SectionList.Section className={className}>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>
          Create / Update Fields
        </SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Configure the fields that can be created or updated by the service
          method
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th>Fields</th>
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
                      field.type === 'enum' && field.options?.enumType
                        ? definitionContainer.nameFromId(field.options.enumType)
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
                <th>Transformers</th>
                {isCreateEnabled && <th className="pl-8 pt-8">Creatable</th>}
                {isUpdateEnabled && <th className="pl-8 pt-8">Updatable</th>}
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
                    {ModelTransformerUtils.getTransformName(
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
                          'service.create.fields',
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
                          'service.update.fields',
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
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
