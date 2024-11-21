import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  MultiCheckboxField,
  SectionList,
  SwitchField,
} from '@halfdomelabs/ui-components';
import { useWatch } from 'react-hook-form';
import { MdInfo } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { useEditedModelConfig } from '../../../_hooks/useEditedModelConfig';

interface GraphQLMutationsSectionProps {
  control: Control<ModelConfig>;
}

export function GraphQLMutationsSection({
  control,
}: GraphQLMutationsSectionProps): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const isAuthEnabled = !!definition.auth;

  const roleOptions =
    definition.auth?.roles.map((role) => ({
      label: role.name,
      value: role.id,
    })) ?? [];

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const controllerConfig = useEditedModelConfig((m) => m.service ?? {});
  const isCreateEnabled = useWatch({
    control,
    name: 'graphql.mutations.create.enabled',
  });
  const isCreateControllerEnabled = controllerConfig.create?.enabled;
  const isUpdateEnabled = useWatch({
    control,
    name: 'graphql.mutations.update.enabled',
  });
  const isUpdateControllerEnabled = controllerConfig.update?.enabled;
  const isDeleteEnabled = useWatch({
    control,
    name: 'graphql.mutations.delete.enabled',
  });
  const isDeleteControllerEnabled = controllerConfig.delete?.enabled;

  return (
    <SectionList.Section>
      <div>
        <SectionList.SectionHeader className="sticky top-2">
          <SectionList.SectionTitle>Mutations</SectionList.SectionTitle>
          <SectionList.SectionDescription>
            Configure the GraphQL mutations that can be performed on this model.
          </SectionList.SectionDescription>
        </SectionList.SectionHeader>
      </div>
      <SectionList.SectionContent className="space-y-6">
        {(!isCreateControllerEnabled ||
          !isUpdateControllerEnabled ||
          !isDeleteControllerEnabled) && (
          <Alert className="max-w-md">
            <MdInfo />
            <Alert.Title>
              Service methods disabled (
              {[
                !isCreateControllerEnabled && 'Create',
                !isUpdateControllerEnabled && 'Update',
                !isDeleteControllerEnabled && 'Delete',
              ]
                .filter(Boolean)
                .join(', ')}
              )
            </Alert.Title>
            <Alert.Description>
              Enable the appropriate methods on the{' '}
              <Link to="../service" className="font-semibold">
                the service tab
              </Link>{' '}
              to expose mutations
            </Alert.Description>
          </Alert>
        )}
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.create.enabled"
            disabled={!isObjectTypeEnabled || !isCreateControllerEnabled}
            label="Create Mutation"
            description="Expose the create method in the GraphQL schema, e.g. createUser(input: $input)."
          />
          {isCreateEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.create.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.update.enabled"
            label="Update Mutation"
            disabled={!isObjectTypeEnabled || !isUpdateControllerEnabled}
            description="Expose the update method in the GraphQL schema, e.g. updateUser(id: $id, input: $input)."
          />
          {isUpdateEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.update.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.delete.enabled"
            label="Delete Mutation"
            disabled={!isObjectTypeEnabled || !isDeleteControllerEnabled}
            description="Expose the delete method in the GraphQL schema, e.g. deleteUser(id: $id)."
          />
          {isDeleteEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.delete.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
