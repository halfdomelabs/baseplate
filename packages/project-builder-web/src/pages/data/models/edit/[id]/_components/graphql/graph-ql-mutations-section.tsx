import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  MultiSwitchField,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';
import { MdInfo } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { useEditedModelConfig } from '../../../../_hooks/use-edited-model-config.js';

interface GraphQLMutationsSectionProps {
  control: Control<ModelConfigInput>;
}

export function GraphQLMutationsSection({
  control,
}: GraphQLMutationsSectionProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();

  const roleOptions = pluginContainer
    .getPluginSpecOptional(authConfigSpec)
    ?.getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

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
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Mutations</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the GraphQL mutations that can be performed on this model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-8">
        {(!isCreateControllerEnabled ||
          !isUpdateControllerEnabled ||
          !isDeleteControllerEnabled) && (
          <Alert className="max-w-md">
            <MdInfo />
            <AlertTitle>
              Service methods disabled (
              {[
                !isCreateControllerEnabled && 'Create',
                !isUpdateControllerEnabled && 'Update',
                !isDeleteControllerEnabled && 'Delete',
              ]
                .filter(Boolean)
                .join(', ')}
              )
            </AlertTitle>
            <AlertDescription>
              Enable the appropriate methods on the{' '}
              <Link to="../service" className="font-semibold">
                the service tab
              </Link>{' '}
              to expose mutations
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <SwitchFieldController
            control={control}
            name="graphql.mutations.create.enabled"
            disabled={!isObjectTypeEnabled || !isCreateControllerEnabled}
            label="Create Mutation"
            description="Expose the create method in the GraphQL schema, e.g. createUser(input: $input)."
          />
          {isCreateEnabled && roleOptions && (
            <MultiSwitchField.Controller
              control={control}
              name="graphql.mutations.create.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="ml-[52px]"
            />
          )}
        </div>
        <div className="space-y-4">
          <SwitchFieldController
            control={control}
            name="graphql.mutations.update.enabled"
            label="Update Mutation"
            disabled={!isObjectTypeEnabled || !isUpdateControllerEnabled}
            description="Expose the update method in the GraphQL schema, e.g. updateUser(id: $id, input: $input)."
          />
          {isUpdateEnabled && roleOptions && (
            <MultiSwitchField.Controller
              control={control}
              name="graphql.mutations.update.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="ml-[52px]"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchFieldController
            control={control}
            name="graphql.mutations.delete.enabled"
            label="Delete Mutation"
            disabled={!isObjectTypeEnabled || !isDeleteControllerEnabled}
            description="Expose the delete method in the GraphQL schema, e.g. deleteUser(id: $id)."
          />
          {isDeleteEnabled && roleOptions && (
            <MultiSwitchField.Controller
              control={control}
              name="graphql.mutations.delete.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="ml-[52px]"
            />
          )}
        </div>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
