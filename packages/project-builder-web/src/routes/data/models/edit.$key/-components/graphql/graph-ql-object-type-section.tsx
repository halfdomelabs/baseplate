import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { authConfigSpec, ModelUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  Checkbox,
  Label,
  MultiSwitchField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useController, useWatch } from 'react-hook-form';
import { HiMiniLockClosed } from 'react-icons/hi2';

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';

interface GraphQLObjectTypeSectionProps {
  control: Control<ModelConfigInput>;
}

interface FieldEntry {
  ref: string;
  roles?: string[];
  instanceRoles?: string[];
}

/**
 * Returns an updated ordered list of field entries when a checkbox is toggled.
 * Preserves existing auth config (roles, instanceRoles) on entries.
 */
function getUpdatedFieldEntries(
  allItems: { id: string }[],
  currentEntries: FieldEntry[],
  checked: boolean,
  id: string,
): FieldEntry[] {
  if (checked) {
    // Add the entry, maintaining order from allItems
    const existingRefs = new Set(currentEntries.map((e) => e.ref));
    return allItems
      .filter((item) => existingRefs.has(item.id) || item.id === id)
      .map(
        (item) =>
          currentEntries.find((e) => e.ref === item.id) ?? { ref: item.id },
      );
  }
  return currentEntries.filter((e) => e.ref !== id);
}

/**
 * Clears both roles and instanceRoles on a specific field entry.
 */
function clearEntryRoles(entries: FieldEntry[], ref: string): FieldEntry[] {
  return entries.map((entry) =>
    entry.ref === ref ? { ...entry, roles: [], instanceRoles: [] } : entry,
  );
}

/**
 * Updates the roles or instanceRoles on a specific field entry.
 */
function updateEntryRoles(
  entries: FieldEntry[],
  ref: string,
  key: 'roles' | 'instanceRoles',
  value: string[],
): FieldEntry[] {
  return entries.map((entry) =>
    entry.ref === ref ? { ...entry, [key]: value } : entry,
  );
}

/**
 * Gets the display names for roles configured on a field entry.
 */
function getConfiguredRoleNames(
  entry: FieldEntry,
  roleOptions: { label: string; value: string }[],
  instanceRoleOptions: { label: string; value: string }[],
): string[] {
  const names: string[] = [];
  for (const roleId of entry.roles ?? []) {
    const role = roleOptions.find((r) => r.value === roleId);
    if (role) {
      names.push(role.label);
    }
  }
  for (const roleId of entry.instanceRoles ?? []) {
    const role = instanceRoleOptions.find((r) => r.value === roleId);
    if (role) {
      names.push(role.label);
    }
  }
  return names;
}

interface FieldAuthPopoverProps {
  entry: FieldEntry;
  roleOptions: { label: string; value: string }[];
  instanceRoleOptions: { label: string; value: string }[];
  disabled?: boolean;
  onRolesChange: (roles: string[]) => void;
  onInstanceRolesChange: (instanceRoles: string[]) => void;
  onClearAll: () => void;
}

function FieldAuthPopover({
  entry,
  roleOptions,
  instanceRoleOptions,
  disabled,
  onRolesChange,
  onInstanceRolesChange,
  onClearAll,
}: FieldAuthPopoverProps): React.ReactElement {
  const hasRoles =
    (entry.roles?.length ?? 0) > 0 || (entry.instanceRoles?.length ?? 0) > 0;
  const configuredNames = getConfiguredRoleNames(
    entry,
    roleOptions,
    instanceRoleOptions,
  );

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className="flex h-6 cursor-pointer items-center justify-end gap-1.5 rounded px-1.5 text-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <HiMiniLockClosed
            className={hasRoles ? 'text-primary' : 'text-muted-foreground'}
          />
          {configuredNames.length > 0 && (
            <Badge
              variant="outline"
              className="block max-w-48 truncate text-xs font-normal"
              title={configuredNames.join(', ')}
            >
              {configuredNames.join(', ')}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="py-1 text-sm font-medium">Field Authorization</p>
            {hasRoles && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs"
                onClick={onClearAll}
              >
                Clear all
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Restrict which roles can view this field. Leave all unchecked for
            unrestricted access.
          </p>
        </div>
        {roleOptions.length > 0 && (
          <MultiSwitchField
            label="Global Roles"
            options={roleOptions}
            value={entry.roles ?? []}
            onChange={onRolesChange}
          />
        )}
        {instanceRoleOptions.length > 0 && (
          <MultiSwitchField
            label="Instance Roles"
            options={instanceRoleOptions}
            value={entry.instanceRoles ?? []}
            onChange={onInstanceRolesChange}
          />
        )}
        {roleOptions.length === 0 && instanceRoleOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No roles configured. Add global roles in Auth settings or instance
            roles in the Authorization tab.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function GraphQLObjectTypeSection({
  control,
}: GraphQLObjectTypeSectionProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const modelId = useEditedModelConfig((model) => model.id);

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  // Auth role options
  const roleOptions =
    pluginContainer
      .use(authConfigSpec)
      .getAuthConfig(definition)
      ?.roles.map((role) => ({
        label: role.name,
        value: role.id,
      })) ?? [];

  const authorizerRoles =
    useEditedModelConfig((model) => model.authorizer?.roles) ?? [];
  const instanceRoleOptions = authorizerRoles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  const hasAuthOptions =
    roleOptions.length > 0 || instanceRoleOptions.length > 0;

  // Fields
  const fields = useEditedModelConfig((model) => model.model.fields);
  const {
    field: { value: fieldsValue = [], onChange: fieldsOnChange },
  } = useController({
    control,
    name: 'graphql.objectType.fields',
  });

  // Local Relations
  const localRelations =
    useEditedModelConfig((model) => model.model.relations) ?? [];
  const {
    field: {
      value: localRelationsValue = [],
      onChange: localRelationsOnChange,
    },
  } = useController({
    control,
    name: 'graphql.objectType.localRelations',
  });

  // Foreign Relations
  const foreignRelations = ModelUtils.getRelationsToModel(definition, modelId);
  const {
    field: {
      value: foreignRelationsValue = [],
      onChange: foreignRelationsOnChange,
    },
  } = useController({
    control,
    name: 'graphql.objectType.foreignRelations',
  });

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Object Type</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the object type that will be exposed in the GraphQL schema
            for this model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-4">
        <SwitchFieldController
          control={control}
          name="graphql.objectType.enabled"
          label="Enable Object Type"
          description="Must be enabled for queries, mutations, and any relations to this model"
        />
        {/* Exposed Fields */}
        <div>
          <Label className="pb-2">Exposed Fields</Label>
          <div className="space-y-0.5">
            {fields.map((field) => {
              const entry = fieldsValue.find(
                (e: FieldEntry) => e.ref === field.id,
              );
              const isChecked = !!entry;
              return (
                <label
                  key={field.id}
                  htmlFor={`field-${field.id}`}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`field-${field.id}`}
                    aria-label={`Expose ${field.name} field`}
                    disabled={!isObjectTypeEnabled}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      fieldsOnChange(
                        getUpdatedFieldEntries(
                          fields,
                          fieldsValue,
                          !!checked,
                          field.id,
                        ),
                      );
                    }}
                  />
                  <div className="flex h-8 w-full items-center gap-4 rounded-md border bg-muted px-3 text-sm">
                    <span>{field.name}</span>
                    <div
                      role="presentation"
                      className="ml-auto"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                    >
                      {isObjectTypeEnabled && hasAuthOptions && (
                        <FieldAuthPopover
                          entry={entry ?? { ref: field.id }}
                          roleOptions={roleOptions}
                          instanceRoleOptions={instanceRoleOptions}
                          disabled={!isChecked}
                          onRolesChange={(roles) => {
                            fieldsOnChange(
                              updateEntryRoles(
                                fieldsValue,
                                field.id,
                                'roles',
                                roles,
                              ),
                            );
                          }}
                          onInstanceRolesChange={(instanceRoles) => {
                            fieldsOnChange(
                              updateEntryRoles(
                                fieldsValue,
                                field.id,
                                'instanceRoles',
                                instanceRoles,
                              ),
                            );
                          }}
                          onClearAll={() => {
                            fieldsOnChange(
                              clearEntryRoles(fieldsValue, field.id),
                            );
                          }}
                        />
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        {/* Exposed Local Relations */}
        {localRelations.length > 0 && (
          <div>
            <Label className="pb-2">Exposed Local Relations</Label>
            <div className="space-y-0.5">
              {localRelations.map((relation) => {
                const entry = localRelationsValue.find(
                  (e: FieldEntry) => e.ref === relation.id,
                );
                const isChecked = !!entry;
                return (
                  <label
                    key={relation.id}
                    htmlFor={`local-rel-${relation.id}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`local-rel-${relation.id}`}
                      aria-label={`Expose ${relation.name} relation`}
                      disabled={!isObjectTypeEnabled}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        localRelationsOnChange(
                          getUpdatedFieldEntries(
                            localRelations,
                            localRelationsValue,
                            !!checked,
                            relation.id,
                          ),
                        );
                      }}
                    />
                    <div className="flex h-8 w-full items-center gap-4 rounded-md border bg-muted px-3 text-sm">
                      <span>{relation.name}</span>
                      <div
                        role="presentation"
                        className="ml-auto"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        {isObjectTypeEnabled && hasAuthOptions && (
                          <FieldAuthPopover
                            entry={entry ?? { ref: relation.id }}
                            roleOptions={roleOptions}
                            instanceRoleOptions={instanceRoleOptions}
                            disabled={!isChecked}
                            onRolesChange={(roles) => {
                              localRelationsOnChange(
                                updateEntryRoles(
                                  localRelationsValue,
                                  relation.id,
                                  'roles',
                                  roles,
                                ),
                              );
                            }}
                            onInstanceRolesChange={(instanceRoles) => {
                              localRelationsOnChange(
                                updateEntryRoles(
                                  localRelationsValue,
                                  relation.id,
                                  'instanceRoles',
                                  instanceRoles,
                                ),
                              );
                            }}
                            onClearAll={() => {
                              localRelationsOnChange(
                                clearEntryRoles(
                                  localRelationsValue,
                                  relation.id,
                                ),
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {/* Exposed Foreign Relations */}
        {foreignRelations.length > 0 && (
          <div>
            <Label className="pb-2">Exposed Foreign Relations</Label>
            <div className="space-y-0.5">
              {foreignRelations.map(({ relation }) => {
                const entry = foreignRelationsValue.find(
                  (e: FieldEntry) => e.ref === relation.foreignId,
                );
                const isChecked = !!entry;
                return (
                  <label
                    key={relation.id}
                    htmlFor={`foreign-rel-${relation.foreignId}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`foreign-rel-${relation.foreignId}`}
                      aria-label={`Expose ${relation.foreignRelationName} relation`}
                      disabled={!isObjectTypeEnabled}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        foreignRelationsOnChange(
                          getUpdatedFieldEntries(
                            foreignRelations.map(({ relation }) => ({
                              id: relation.foreignId,
                            })),
                            foreignRelationsValue,
                            !!checked,
                            relation.foreignId,
                          ),
                        );
                      }}
                    />
                    <div className="flex h-8 w-full items-center gap-4 rounded-md border bg-muted px-3 text-sm">
                      <span>{relation.foreignRelationName}</span>
                      <div
                        role="presentation"
                        className="ml-auto"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        {isObjectTypeEnabled && hasAuthOptions && (
                          <FieldAuthPopover
                            entry={entry ?? { ref: relation.foreignId }}
                            roleOptions={roleOptions}
                            instanceRoleOptions={instanceRoleOptions}
                            disabled={!isChecked}
                            onRolesChange={(roles) => {
                              foreignRelationsOnChange(
                                updateEntryRoles(
                                  foreignRelationsValue,
                                  relation.foreignId,
                                  'roles',
                                  roles,
                                ),
                              );
                            }}
                            onInstanceRolesChange={(instanceRoles) => {
                              foreignRelationsOnChange(
                                updateEntryRoles(
                                  foreignRelationsValue,
                                  relation.foreignId,
                                  'instanceRoles',
                                  instanceRoles,
                                ),
                              );
                            }}
                            onClearAll={() => {
                              foreignRelationsOnChange(
                                clearEntryRoles(
                                  foreignRelationsValue,
                                  relation.foreignId,
                                ),
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </SectionListSectionContent>
    </SectionListSection>
  );
}
