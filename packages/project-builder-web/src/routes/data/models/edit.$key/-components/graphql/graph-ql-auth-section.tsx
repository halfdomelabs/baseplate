import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchField,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { useWatch } from 'react-hook-form';
import { MdCheck } from 'react-icons/md';

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';

interface GraphQLAuthSectionProps {
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
  modelKey: string;
}

interface RoleOption {
  label: string;
  value: string;
}

type MutationMethodName = 'create' | 'delete' | 'update';

interface EnabledMutation {
  name: MutationMethodName;
  label: string;
}

export function GraphQLAuthSection({
  control,
  setValue,
  modelKey,
}: GraphQLAuthSectionProps): React.JSX.Element | null {
  const { definition, pluginContainer } = useProjectDefinition();

  const authConfig = pluginContainer
    .use(authConfigSpec)
    .getAuthConfig(definition);

  const authorizerRoles =
    useEditedModelConfig((model) => model.authorizer?.roles) ?? [];

  const isGetEnabled = useWatch({
    control,
    name: 'graphql.queries.get.enabled',
  });
  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });
  const isCountEnabled = useWatch({
    control,
    name: 'graphql.queries.list.count.enabled',
  });

  const controllerConfig = useEditedModelConfig((m) => m.service ?? {});
  const isCreateEnabled = useWatch({
    control,
    name: 'graphql.mutations.create.enabled',
  });
  const isUpdateEnabled = useWatch({
    control,
    name: 'graphql.mutations.update.enabled',
  });
  const isDeleteEnabled = useWatch({
    control,
    name: 'graphql.mutations.delete.enabled',
  });

  const queryGlobalRoles =
    useWatch({ control, name: 'graphql.queries.globalRoles' }) ?? [];
  const queryInstanceRoles =
    useWatch({ control, name: 'graphql.queries.instanceRoles' }) ?? [];

  const serviceCreate = useEditedModelConfig((m) => m.service?.create);
  const serviceUpdate = useEditedModelConfig((m) => m.service?.update);
  const serviceDelete = useEditedModelConfig((m) => m.service?.delete);

  if (!authConfig) {
    return null;
  }

  const globalRoleOptions: RoleOption[] = authConfig.roles
    .filter((role) => role.name !== 'system')
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const instanceRoleOptions: RoleOption[] = authorizerRoles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  const isCreateControllerEnabled = controllerConfig.create?.enabled;
  const isUpdateControllerEnabled = controllerConfig.update?.enabled;
  const isDeleteControllerEnabled = controllerConfig.delete?.enabled;

  const hasAnyQueryEnabled =
    (isGetEnabled ?? false) ||
    (isListEnabled ?? false) ||
    (isCountEnabled ?? false);

  const hasAnyMutationEnabled =
    ((isCreateControllerEnabled ?? false) && (isCreateEnabled ?? false)) ||
    ((isUpdateControllerEnabled ?? false) && (isUpdateEnabled ?? false)) ||
    ((isDeleteControllerEnabled ?? false) && (isDeleteEnabled ?? false));

  if (!hasAnyQueryEnabled && !hasAnyMutationEnabled) {
    return null;
  }

  const hasInstanceRoles = instanceRoleOptions.length > 0;
  const globalRoleIds = globalRoleOptions.map((r) => r.value);
  const instanceRoleIds = instanceRoleOptions.map((r) => r.value);

  const enabledMutations: EnabledMutation[] = [
    ...((isCreateControllerEnabled ?? false) && (isCreateEnabled ?? false)
      ? [{ name: 'create' as const, label: 'Create' }]
      : []),
    ...((isUpdateControllerEnabled ?? false) && (isUpdateEnabled ?? false)
      ? [{ name: 'update' as const, label: 'Update' }]
      : []),
    ...((isDeleteControllerEnabled ?? false) && (isDeleteEnabled ?? false)
      ? [{ name: 'delete' as const, label: 'Delete' }]
      : []),
  ];

  const mutationGlobalRolesMap: Record<MutationMethodName, string[]> = {
    create: serviceCreate?.globalRoles ?? [],
    update: serviceUpdate?.globalRoles ?? [],
    delete: serviceDelete?.globalRoles ?? [],
  };

  const mutationInstanceRolesMap: Record<string, string[]> = {
    update: serviceUpdate?.instanceRoles ?? [],
    delete: serviceDelete?.instanceRoles ?? [],
  };

  function toggleQueryGlobalRole(roleId: string, checked: boolean): void {
    const newValue = checked
      ? globalRoleIds.filter(
          (id) => id === roleId || queryGlobalRoles.includes(id),
        )
      : queryGlobalRoles.filter((id) => id !== roleId);
    setValue('graphql.queries.globalRoles', newValue, { shouldDirty: true });
  }

  function toggleQueryInstanceRole(roleId: string, checked: boolean): void {
    const newValue = checked
      ? instanceRoleIds.filter(
          (id) => id === roleId || queryInstanceRoles.includes(id),
        )
      : queryInstanceRoles.filter((id) => id !== roleId);
    setValue('graphql.queries.instanceRoles', newValue, { shouldDirty: true });
  }

  const tableClassName =
    'w-full border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10 [&_th]:py-2';

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Authorization</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure which roles can access GraphQL operations. Mutation
          authorization is configured on the{' '}
          <Link
            to="/data/models/edit/$key/service"
            params={{ key: modelKey }}
            className="font-semibold underline"
          >
            Service tab
          </Link>
          .
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="max-w-xl">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className="w-full">
                <Label>Global Roles</Label>
              </th>
              {hasAnyQueryEnabled && <th className="pl-8">Queries</th>}
              {enabledMutations.map((mutation) => (
                <th key={mutation.name} className="pl-8">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/data/models/edit/$key/service"
                        params={{ key: modelKey }}
                      >
                        {mutation.label}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Configured on Service tab</TooltipContent>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {globalRoleOptions.map((role) => (
              <tr key={role.value}>
                <td>
                  <div className="flex h-8 w-full items-center rounded-md border bg-muted px-3 text-sm">
                    {role.label}
                  </div>
                </td>
                {hasAnyQueryEnabled && (
                  <td className="pl-8">
                    <SwitchField
                      value={queryGlobalRoles.includes(role.value)}
                      onChange={(checked) => {
                        toggleQueryGlobalRole(role.value, checked);
                      }}
                    />
                  </td>
                )}
                {enabledMutations.map((mutation) => (
                  <td key={mutation.name} className="pl-8">
                    {mutationGlobalRolesMap[mutation.name].includes(
                      role.value,
                    ) ? (
                      <MdCheck className="size-5 text-success-foreground" />
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
            {hasInstanceRoles && (
              <>
                <tr>
                  <th className="w-full">
                    <Label>Instance Roles</Label>
                  </th>
                </tr>
                {instanceRoleOptions.map((role) => (
                  <tr key={role.value}>
                    <td>
                      <div className="flex h-8 w-full items-center rounded-md border bg-muted px-3 text-sm">
                        {role.label}
                      </div>
                    </td>
                    {hasAnyQueryEnabled && (
                      <td className="pl-8">
                        <SwitchField
                          value={queryInstanceRoles.includes(role.value)}
                          onChange={(checked) => {
                            toggleQueryInstanceRole(role.value, checked);
                          }}
                        />
                      </td>
                    )}
                    {enabledMutations.map((mutation) => {
                      if (mutation.name === 'create') {
                        return (
                          <td key={mutation.name} className="pl-8">
                            <span className="text-muted-foreground">
                              &mdash;
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={mutation.name} className="pl-8">
                          {(
                            mutationInstanceRolesMap[mutation.name] ?? []
                          ).includes(role.value) ? (
                            <MdCheck className="size-5 text-success-foreground" />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
