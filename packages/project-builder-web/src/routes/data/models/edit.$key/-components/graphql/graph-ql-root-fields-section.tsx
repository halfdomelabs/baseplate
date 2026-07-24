import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Label,
  MultiComboboxField,
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
import { HiMiniAdjustmentsHorizontal } from 'react-icons/hi2';
import { MdInfo, MdWarning } from 'react-icons/md';

interface GraphQLRootFieldsSectionProps {
  control: Control<ModelConfigInput>;
}

export function GraphQLRootFieldsSection({
  control,
}: GraphQLRootFieldsSectionProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const controllerConfig = useWatch({ control, name: 'service' }) ?? {};
  const isCreateControllerEnabled = controllerConfig.create?.enabled;
  const isUpdateControllerEnabled = controllerConfig.update?.enabled;
  const isDeleteControllerEnabled = controllerConfig.delete?.enabled;

  const hasAnyMutation =
    (isCreateControllerEnabled ?? false) ||
    (isUpdateControllerEnabled ?? false) ||
    (isDeleteControllerEnabled ?? false);

  const isWhereFilteringEnabled = useWatch({
    control,
    name: 'graphql.queries.list.where.enabled',
  });
  const queryGlobalRoles = useWatch({
    control,
    name: 'graphql.queries.globalRoles',
  });
  const queryInstanceRoles = useWatch({
    control,
    name: 'graphql.queries.instanceRoles',
  });
  const {
    field: { value: exposedFields = [], onChange: onExposedFieldsChange },
  } = useController({ control, name: 'graphql.objectType.fields' });

  const filterableOptions = exposedFields.map((entry) => ({
    label: definitionContainer.nameFromId(entry.ref),
    value: entry.ref,
  }));

  const filterableFieldRefs = exposedFields
    .filter((entry) => entry.filterable)
    .map((entry) => entry.ref);

  const onFilterableFieldRefsChange = (refs: string[]): void => {
    const refSet = new Set(refs);
    onExposedFieldsChange(
      exposedFields.map((entry) => ({
        ...entry,
        filterable: refSet.has(entry.ref),
      })),
    );
  };

  // A selected field is only safe to filter on if its read access is no
  // narrower than the list query's own roles — see
  // ModelUtils.isFieldSafeToFilter. Surfaced as a warning rather than
  // hidden from the options, so an author isn't left wondering why a field
  // they expect to see is missing from the picker.
  const unsafeFilterableFieldNames = exposedFields
    .filter(
      (entry) =>
        entry.filterable &&
        !ModelUtils.isFieldSafeToFilter(
          {
            globalRoles: entry.globalRoles ?? [],
            instanceRoles: entry.instanceRoles ?? [],
          },
          {
            globalRoles: queryGlobalRoles ?? [],
            instanceRoles: queryInstanceRoles ?? [],
          },
        ),
    )
    .map((entry) => definitionContainer.nameFromId(entry.ref));

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Root Fields</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure which GraphQL queries and mutations are exposed for this
            model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-4">
        {!isObjectTypeEnabled && (
          <Alert className="max-w-lg">
            <MdInfo />
            <AlertTitle>Object type missing</AlertTitle>
            <AlertDescription>
              Enable the object type to expose queries and mutations
            </AlertDescription>
          </Alert>
        )}
        {unsafeFilterableFieldNames.length > 0 && (
          <Alert variant="warning" className="max-w-2xl">
            <MdWarning />
            <AlertTitle>Field roles narrower than the query</AlertTitle>
            <AlertDescription>
              {unsafeFilterableFieldNames.join(', ')}{' '}
              {unsafeFilterableFieldNames.length === 1 ? 'is' : 'are'}{' '}
              filterable but readable by fewer roles than the query itself,
              letting a caller infer its value without permission to read it.
              Match the roles or unselect it below — sync will otherwise fail.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label>Queries</Label>
            <ToggleItem
              control={control}
              name="graphql.queries.get.enabled"
              disabled={!isObjectTypeEnabled}
              label="Get By ID"
              description="Fetch a single record, e.g. post(id: ID!)"
            />
            <ToggleItem
              control={control}
              name="graphql.queries.list.enabled"
              disabled={!isObjectTypeEnabled}
              label="List"
              description="Query multiple records, e.g. posts(where: ...)"
            />
            <ToggleItem
              control={control}
              name="graphql.queries.list.count.enabled"
              disabled={!isObjectTypeEnabled}
              label="Count"
              description="Count matching records, e.g. postsCount(...)"
            />
            <ToggleItem
              control={control}
              name="graphql.queries.list.connection.enabled"
              disabled={!isObjectTypeEnabled}
              label="Connection"
              description="Cursor-based pagination, e.g. postsConnection(first, after)"
            />
            <div className="flex items-start gap-1">
              <ToggleItem
                control={control}
                name="graphql.queries.list.where.enabled"
                disabled={!isObjectTypeEnabled}
                label="Where Filtering"
                description="Filter records by field values, e.g. posts(where: { title: { contains: ... } })"
              />
              {isWhereFilteringEnabled && (
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Configure filterable fields"
                        className="mt-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-muted"
                      />
                    }
                  >
                    <HiMiniAdjustmentsHorizontal
                      className={
                        filterableFieldRefs.length > 0
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 space-y-2">
                    <p className="text-sm font-medium">Filterable Fields</p>
                    <p className="text-xs text-muted-foreground">
                      Choose which exposed fields can be used as `where` filter
                      operands.
                    </p>
                    <MultiComboboxField
                      placeholder="Select fields..."
                      options={filterableOptions}
                      value={filterableFieldRefs}
                      onChange={onFilterableFieldRefsChange}
                      noResultsText="No fields exposed"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          {hasAnyMutation && (
            <div className="space-y-4">
              <Label>Mutations</Label>
              {isCreateControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.create.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Create"
                  description="Add a new record, e.g. createPost(...)"
                />
              )}
              {isUpdateControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.update.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Update"
                  description="Modify an existing record, e.g. updatePost(...)"
                />
              )}
              {isDeleteControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.delete.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Delete"
                  description="Remove a record, e.g. deletePost(...)"
                />
              )}
            </div>
          )}
        </div>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

function ToggleItem({
  control,
  name,
  disabled,
  label,
  description,
}: {
  control: Control<ModelConfigInput>;
  name:
    | 'graphql.queries.get.enabled'
    | 'graphql.queries.list.enabled'
    | 'graphql.queries.list.count.enabled'
    | 'graphql.queries.list.connection.enabled'
    | 'graphql.queries.list.where.enabled'
    | 'graphql.mutations.create.enabled'
    | 'graphql.mutations.update.enabled'
    | 'graphql.mutations.delete.enabled';
  disabled: boolean;
  label: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <SwitchFieldController
        control={control}
        name={name}
        disabled={disabled}
        label={label}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
