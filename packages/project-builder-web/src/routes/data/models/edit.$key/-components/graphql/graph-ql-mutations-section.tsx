import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { useWatch } from 'react-hook-form';
import { MdInfo } from 'react-icons/md';

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';

interface GraphQLMutationsSectionProps {
  control: Control<ModelConfigInput>;
  modelKey: string;
}

function DerivedAuthBadges({
  globalRoles,
  instanceRoles,
  roleMap,
}: {
  globalRoles: string[];
  instanceRoles?: string[];
  roleMap: Map<string, string>;
}): React.JSX.Element {
  const hasInstanceRoles = instanceRoles && instanceRoles.length > 0;
  const hasGlobalRoles = globalRoles.length > 0;

  if (!hasGlobalRoles && !hasInstanceRoles) {
    return (
      <div className="ml-10 flex items-center gap-2">
        <Badge variant="outline">Public</Badge>
      </div>
    );
  }

  if (hasInstanceRoles) {
    return (
      <div className="ml-10 flex items-center gap-2">
        <Badge variant="secondary">Authenticated</Badge>
        <span className="text-xs text-muted-foreground">
          Service-level authorization applies
        </span>
      </div>
    );
  }

  return (
    <div className="ml-10 flex items-center gap-2">
      {globalRoles.map((roleId) => (
        <Badge key={roleId} variant="secondary">
          {roleMap.get(roleId) ?? roleId}
        </Badge>
      ))}
    </div>
  );
}

export function GraphQLMutationsSection({
  control,
  modelKey,
}: GraphQLMutationsSectionProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();

  const authConfig = pluginContainer
    .use(authConfigSpec)
    .getAuthConfig(definition);

  const roleMap = new Map<string, string>(
    authConfig?.roles
      .filter((role) => role.name !== 'system')
      .map((role) => [role.id, role.name]),
  );

  const isAuthEnabled = !!authConfig;

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

  const serviceCreate = useEditedModelConfig((m) => m.service?.create);
  const serviceUpdate = useEditedModelConfig((m) => m.service?.update);
  const serviceDelete = useEditedModelConfig((m) => m.service?.delete);

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Mutations</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the GraphQL mutations that can be performed on this model.
            {isAuthEnabled && (
              <>
                {' '}
                Authorization is configured on the{' '}
                <Link
                  to="/data/models/edit/$key/service"
                  params={{ key: modelKey }}
                  className="font-semibold underline"
                >
                  Service tab
                </Link>
                .
              </>
            )}
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-8">
        {!isCreateControllerEnabled &&
          !isUpdateControllerEnabled &&
          !isDeleteControllerEnabled && (
            <Alert className="max-w-md">
              <MdInfo />
              <AlertTitle>No service methods enabled</AlertTitle>
              <AlertDescription>
                <div>
                  Enable methods on the{' '}
                  <Link
                    to="/data/models/edit/$key/service"
                    params={{ key: modelKey }}
                    className="font-semibold"
                  >
                    Service tab
                  </Link>{' '}
                  to expose mutations
                </div>
              </AlertDescription>
            </Alert>
          )}
        {isCreateControllerEnabled && (
          <div className="space-y-4">
            <SwitchFieldController
              control={control}
              name="graphql.mutations.create.enabled"
              disabled={!isObjectTypeEnabled}
              label="Create Mutation"
              description="Expose the create method in the GraphQL schema, e.g. createUser(input: $input)."
            />
            {isCreateEnabled && isAuthEnabled && (
              <DerivedAuthBadges
                globalRoles={serviceCreate?.globalRoles ?? []}
                roleMap={roleMap}
              />
            )}
          </div>
        )}
        {isUpdateControllerEnabled && (
          <div className="space-y-4">
            <SwitchFieldController
              control={control}
              name="graphql.mutations.update.enabled"
              label="Update Mutation"
              disabled={!isObjectTypeEnabled}
              description="Expose the update method in the GraphQL schema, e.g. updateUser(id: $id, input: $input)."
            />
            {isUpdateEnabled && isAuthEnabled && (
              <DerivedAuthBadges
                globalRoles={serviceUpdate?.globalRoles ?? []}
                instanceRoles={serviceUpdate?.instanceRoles ?? []}
                roleMap={roleMap}
              />
            )}
          </div>
        )}
        {isDeleteControllerEnabled && (
          <div className="space-y-2">
            <SwitchFieldController
              control={control}
              name="graphql.mutations.delete.enabled"
              label="Delete Mutation"
              disabled={!isObjectTypeEnabled}
              description="Expose the delete method in the GraphQL schema, e.g. deleteUser(id: $id)."
            />
            {isDeleteEnabled && isAuthEnabled && (
              <DerivedAuthBadges
                globalRoles={serviceDelete?.globalRoles ?? []}
                instanceRoles={serviceDelete?.instanceRoles ?? []}
                roleMap={roleMap}
              />
            )}
          </div>
        )}
      </SectionListSectionContent>
    </SectionListSection>
  );
}
