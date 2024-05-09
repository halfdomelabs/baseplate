import {
  ModelConfig,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button, Dropdown } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import ServiceEmbeddedRelationForm from './ServiceEmbeddedRelationForm';
import ServiceFileTransformerForm from './ServiceFileTransformerForm';
import { LinkButton } from 'src/components';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  originalModel: ModelConfig;
}

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
  const { parsedProject } = useProjectDefinition();

  return (
    <div className={clsx('space-y-4', className)}>
      <h2>Transformers</h2>
      {!fields.length && <div>No transformers</div>}
      {fields.map((field, idx) => {
        switch (field.type) {
          case 'embeddedRelation':
            return (
              <ServiceEmbeddedRelationForm
                key={field.id}
                formProps={formProps}
                onRemove={() => remove(idx)}
                idx={idx}
              />
            );
          case 'password':
            return (
              <div className="flex flex-row space-x-4" key={field.id}>
                <div>
                  <strong>Password Transformer</strong>
                </div>
                <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
              </div>
            );
          case 'file':
            return (
              <ServiceFileTransformerForm
                key={field.id}
                control={control}
                onRemove={() => remove(idx)}
                idx={idx}
                originalModel={originalModel}
              />
            );
          default:
            return (
              <div key={(field as { id: string }).id}>
                Unknown transformer type {(field as { type: string }).type}
                <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
              </div>
            );
        }
      })}
      <Dropdown>
        <Dropdown.Trigger asChild>
          <Button>Add Transformer</Button>
        </Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Group>
            {!fields.some((f) => f.type === 'password') && (
              <Dropdown.Item
                onSelect={() =>
                  append({
                    id: modelTransformerEntityType.generateNewId(),
                    type: 'password',
                  })
                }
              >
                Password
              </Dropdown.Item>
            )}
            {parsedProject.projectDefinition.storage && (
              <Dropdown.Item
                onSelect={() =>
                  append({
                    id: modelTransformerEntityType.generateNewId(),
                    fileRelationRef: '',
                    type: 'file',
                  })
                }
              >
                File
              </Dropdown.Item>
            )}
            <Dropdown.Item
              onSelect={() =>
                append({
                  id: modelTransformerEntityType.generateNewId(),
                  foreignRelationRef: '',
                  type: 'embeddedRelation',
                  embeddedFieldNames: [],
                  modelRef: '',
                })
              }
            >
              Embedded Relation
            </Dropdown.Item>
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown>
    </div>
  );
}

export default ServiceEmbeddedRelationsForm;
