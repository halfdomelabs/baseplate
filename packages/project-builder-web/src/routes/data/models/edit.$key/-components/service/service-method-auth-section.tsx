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
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';

interface ServiceMethodAuthSectionProps {
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
}

type ServiceMethodName = 'create' | 'delete' | 'update';

interface EnabledMethod {
  name: ServiceMethodName;
  label: string;
}

interface RoleOption {
  label: string;
  value: string;
}

export function ServiceMethodAuthSection({
  control,
  setValue,
}: ServiceMethodAuthSectionProps): React.JSX.Element | null {
  const { definition, pluginContainer } = useProjectDefinition();

  const globalRoleOptions = pluginContainer
    .use(authConfigSpec)
    .getAuthConfig(definition)
    ?.roles.filter((role) => role.name !== 'system')
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const authorizerRoles =
    useEditedModelConfig((model) => model.authorizer?.roles) ?? [];
  const instanceRoleOptions: RoleOption[] = authorizerRoles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  const isCreateEnabled = useWatch({
    control,
    name: 'service.create.enabled',
  });
  const isUpdateEnabled = useWatch({
    control,
    name: 'service.update.enabled',
  });
  const isDeleteEnabled = useWatch({
    control,
    name: 'service.delete.enabled',
  });

  const createGlobalRoles =
    useWatch({ control, name: 'service.create.globalRoles' }) ?? [];
  const updateGlobalRoles =
    useWatch({ control, name: 'service.update.globalRoles' }) ?? [];
  const deleteGlobalRoles =
    useWatch({ control, name: 'service.delete.globalRoles' }) ?? [];

  const updateInstanceRoles =
    useWatch({ control, name: 'service.update.instanceRoles' }) ?? [];
  const deleteInstanceRoles =
    useWatch({ control, name: 'service.delete.instanceRoles' }) ?? [];

  if (!globalRoleOptions) {
    return null;
  }

  if (!isCreateEnabled && !isUpdateEnabled && !isDeleteEnabled) {
    return null;
  }

  const enabledMethods: EnabledMethod[] = [
    ...(isCreateEnabled ? [{ name: 'create' as const, label: 'Create' }] : []),
    ...(isUpdateEnabled ? [{ name: 'update' as const, label: 'Update' }] : []),
    ...(isDeleteEnabled ? [{ name: 'delete' as const, label: 'Delete' }] : []),
  ];

  const hasInstanceRoles = instanceRoleOptions.length > 0;
  const globalRoleIds = globalRoleOptions.map((r) => r.value);
  const instanceRoleIds = instanceRoleOptions.map((r) => r.value);

  const globalRolesMap: Record<ServiceMethodName, string[]> = {
    create: createGlobalRoles,
    update: updateGlobalRoles,
    delete: deleteGlobalRoles,
  };

  const instanceRolesMap: Record<string, string[]> = {
    update: updateInstanceRoles,
    delete: deleteInstanceRoles,
  };

  function toggleGlobalRole(
    method: ServiceMethodName,
    roleId: string,
    checked: boolean,
  ): void {
    const current = globalRolesMap[method];
    const newValue = checked
      ? globalRoleIds.filter((id) => id === roleId || current.includes(id))
      : current.filter((id) => id !== roleId);
    setValue(`service.${method}.globalRoles`, newValue, { shouldDirty: true });
  }

  function toggleInstanceRole(
    method: 'delete' | 'update',
    roleId: string,
    checked: boolean,
  ): void {
    const current = instanceRolesMap[method];
    const newValue = checked
      ? instanceRoleIds.filter((id) => id === roleId || current.includes(id))
      : current.filter((id) => id !== roleId);
    setValue(`service.${method}.instanceRoles`, newValue, {
      shouldDirty: true,
    });
  }

  const tableClassName =
    'w-full border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10 [&_th]:py-2';

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Authorization</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure which roles are required to perform service operations.
          Leave all unchecked for unrestricted access.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="max-w-xl">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className="w-full">
                <Label>Global Roles</Label>
              </th>
              {enabledMethods.map((method) => (
                <th key={method.name} className="pl-8">
                  {method.label}
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
                {enabledMethods.map((method) => (
                  <td key={method.name} className="pl-8">
                    <SwitchField
                      value={globalRolesMap[method.name].includes(role.value)}
                      onChange={(checked) => {
                        toggleGlobalRole(method.name, role.value, checked);
                      }}
                    />
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
                    {enabledMethods.map((method) => (
                      <td key={method.name} className="pl-8">
                        {method.name === 'create' ? (
                          <span className="text-muted-foreground">&mdash;</span>
                        ) : (
                          <SwitchField
                            value={instanceRolesMap[method.name].includes(
                              role.value,
                            )}
                            onChange={(checked) => {
                              toggleInstanceRole(
                                method.name as 'delete' | 'update',
                                role.value,
                                checked,
                              );
                            }}
                          />
                        )}
                      </td>
                    ))}
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
