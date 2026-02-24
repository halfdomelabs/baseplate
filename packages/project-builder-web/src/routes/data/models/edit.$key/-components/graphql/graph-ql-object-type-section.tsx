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
  globalRoles?: string[];
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
    entry.ref === ref
      ? { ...entry, globalRoles: [], instanceRoles: [] }
      : entry,
  );
}

/**
 * Updates the roles or instanceRoles on a specific field entry.
 */
function updateEntryRoles(
  entries: FieldEntry[],
  ref: string,
  key: 'globalRoles' | 'instanceRoles',
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
  for (const roleId of entry.globalRoles ?? []) {
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

interface RoleOptions {
  roleOptions: { label: string; value: string }[];
  instanceRoleOptions: { label: string; value: string }[];
}

interface FieldEntryRowProps extends RoleOptions {
  id: string;
  entryRef: string;
  label: string;
  entry: FieldEntry | undefined;
  entries: FieldEntry[];
  allItems: { id: string }[];
  disabled: boolean;
  showAuth: boolean;
  onChange: (entries: FieldEntry[]) => void;
}

function FieldEntryRow({
  id,
  entryRef,
  label,
  entry,
  entries,
  allItems,
  disabled,
  showAuth,
  roleOptions,
  instanceRoleOptions,
  onChange,
}: FieldEntryRowProps): React.ReactElement {
  const isChecked = !!entry;
  return (
    <label
      key={entryRef}
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
    >
      <Checkbox
        id={id}
        aria-label={`Expose ${label}`}
        disabled={disabled}
        checked={isChecked}
        onCheckedChange={(checked) => {
          onChange(
            getUpdatedFieldEntries(allItems, entries, !!checked, entryRef),
          );
        }}
      />
      <div className="flex h-8 w-full items-center gap-4 rounded-md border bg-muted px-3 text-sm">
        <span>{label}</span>
        <div
          role="presentation"
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {showAuth && (
            <FieldAuthPopover
              entry={entry ?? { ref: entryRef }}
              roleOptions={roleOptions}
              instanceRoleOptions={instanceRoleOptions}
              disabled={!isChecked}
              onGlobalRolesChange={(roles) => {
                onChange(
                  updateEntryRoles(entries, entryRef, 'globalRoles', roles),
                );
              }}
              onInstanceRolesChange={(instanceRoles) => {
                onChange(
                  updateEntryRoles(
                    entries,
                    entryRef,
                    'instanceRoles',
                    instanceRoles,
                  ),
                );
              }}
              onClearAll={() => {
                onChange(clearEntryRoles(entries, entryRef));
              }}
            />
          )}
        </div>
      </div>
    </label>
  );
}

interface FieldEntryListProps extends RoleOptions {
  label: string;
  items: { id: string; name: string }[];
  entries: FieldEntry[];
  disabled: boolean;
  showAuth: boolean;
  idPrefix: string;
  onChange: (entries: FieldEntry[]) => void;
  getId?: (item: { id: string; name: string }) => string;
  getLabel?: (item: { id: string; name: string }) => string;
}

function FieldEntryList({
  label: listLabel,
  items,
  entries,
  disabled,
  showAuth,
  idPrefix,
  roleOptions,
  instanceRoleOptions,
  onChange,
  getId = (item) => item.id,
  getLabel = (item) => item.name,
}: FieldEntryListProps): React.ReactElement {
  return (
    <div>
      <Label className="pb-2">{listLabel}</Label>
      <div className="space-y-0.5">
        {items.map((item) => {
          const itemRef = getId(item);
          return (
            <FieldEntryRow
              key={item.id}
              id={`${idPrefix}-${itemRef}`}
              entryRef={itemRef}
              label={getLabel(item)}
              entry={entries.find((e: FieldEntry) => e.ref === itemRef)}
              entries={entries}
              allItems={items.map((i) => ({ id: getId(i) }))}
              disabled={disabled}
              showAuth={showAuth}
              roleOptions={roleOptions}
              instanceRoleOptions={instanceRoleOptions}
              onChange={onChange}
            />
          );
        })}
      </div>
    </div>
  );
}

interface FieldAuthPopoverProps {
  entry: FieldEntry;
  roleOptions: { label: string; value: string }[];
  instanceRoleOptions: { label: string; value: string }[];
  disabled?: boolean;
  onGlobalRolesChange: (globalRoles: string[]) => void;
  onInstanceRolesChange: (instanceRoles: string[]) => void;
  onClearAll: () => void;
}

function FieldAuthPopover({
  entry,
  roleOptions,
  instanceRoleOptions,
  disabled,
  onGlobalRolesChange,
  onInstanceRolesChange,
  onClearAll,
}: FieldAuthPopoverProps): React.ReactElement {
  const hasRoles =
    (entry.globalRoles?.length ?? 0) > 0 ||
    (entry.instanceRoles?.length ?? 0) > 0;
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
            value={entry.globalRoles ?? []}
            onChange={onGlobalRolesChange}
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
        <FieldEntryList
          label="Exposed Fields"
          items={fields}
          entries={fieldsValue}
          disabled={!isObjectTypeEnabled}
          showAuth={!!isObjectTypeEnabled && hasAuthOptions}
          idPrefix="field"
          roleOptions={roleOptions}
          instanceRoleOptions={instanceRoleOptions}
          onChange={fieldsOnChange}
        />
        {localRelations.length > 0 && (
          <FieldEntryList
            label="Exposed Local Relations"
            items={localRelations}
            entries={localRelationsValue}
            disabled={!isObjectTypeEnabled}
            showAuth={!!isObjectTypeEnabled && hasAuthOptions}
            idPrefix="local-rel"
            roleOptions={roleOptions}
            instanceRoleOptions={instanceRoleOptions}
            onChange={localRelationsOnChange}
          />
        )}
        {foreignRelations.length > 0 && (
          <FieldEntryList
            label="Exposed Foreign Relations"
            items={foreignRelations.map(({ relation }) => ({
              id: relation.id,
              name: relation.foreignRelationName,
            }))}
            entries={foreignRelationsValue}
            disabled={!isObjectTypeEnabled}
            showAuth={!!isObjectTypeEnabled && hasAuthOptions}
            idPrefix="foreign-rel"
            roleOptions={roleOptions}
            instanceRoleOptions={instanceRoleOptions}
            onChange={foreignRelationsOnChange}
            getId={({ id }) => {
              const rel = foreignRelations.find((fr) => fr.relation.id === id);
              return rel?.relation.foreignId ?? id;
            }}
          />
        )}
      </SectionListSectionContent>
    </SectionListSection>
  );
}
