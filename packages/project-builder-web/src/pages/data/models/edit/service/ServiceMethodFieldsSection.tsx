import {
  ModelConfig,
  ModelTransformerUtils,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';

import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';

interface ServiceMethodFieldsSectionProps {
  className?: string;
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
}

export function ServiceMethodFieldsSection({
  className,
  control,
  setValue,
}: ServiceMethodFieldsSectionProps): JSX.Element | null {
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
    'border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10';

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
              {isCreateEnabled && <th className="pl-8">Creatable</th>}
              {isUpdateEnabled && <th className="pl-8">Updatable</th>}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id}>
                <td>
                  <div className="w-full rounded-md border bg-muted px-2 py-1">
                    {field.name}
                  </div>
                </td>
                {isCreateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={createFields.includes(field.id)}
                      onChange={(value) =>
                        setValue(
                          'service.create.fields',
                          value
                            ? [...createFields, field.id]
                            : createFields.filter((id) => id !== field.id),
                        )
                      }
                    />
                  </td>
                )}
                {isUpdateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={updateFields.includes(field.id)}
                      onChange={(value) =>
                        setValue(
                          'service.update.fields',
                          value
                            ? [...updateFields, field.id]
                            : updateFields.filter((id) => id !== field.id),
                        )
                      }
                    />
                  </td>
                )}
              </tr>
            ))}
            {!!transformers.length && (
              <tr>
                <th className="pt-8">Transformers</th>
                {isCreateEnabled && <th className="pl-8 pt-8">Creatable</th>}
                {isUpdateEnabled && <th className="pl-8 pt-8">Updatable</th>}
              </tr>
            )}
            {transformers.map((transformer) => (
              <tr key={transformer.id}>
                <td>
                  <div className="w-full rounded-md border bg-muted px-2 py-1">
                    {ModelTransformerUtils.getTransformName(
                      definitionContainer,
                      transformer,
                      pluginContainer,
                    )}
                  </div>
                </td>
                {isCreateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={createTransformers.includes(transformer.id)}
                      onChange={(value) =>
                        setValue(
                          'service.create.fields',
                          value
                            ? [...createTransformers, transformer.id]
                            : createTransformers.filter(
                                (id) => id !== transformer.id,
                              ),
                        )
                      }
                    />
                  </td>
                )}
                {isUpdateEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={updateTransformers.includes(transformer.id)}
                      onChange={(value) =>
                        setValue(
                          'service.update.fields',
                          value
                            ? [...updateTransformers, transformer.id]
                            : updateTransformers.filter(
                                (id) => id !== transformer.id,
                              ),
                        )
                      }
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
