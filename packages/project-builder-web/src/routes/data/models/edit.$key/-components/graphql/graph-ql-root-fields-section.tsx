import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  MultiComboboxField,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useController, useWatch } from 'react-hook-form';
import { MdInfo, MdSettings, MdWarning } from 'react-icons/md';

interface GraphQLRootFieldsSectionProps {
  control: Control<ModelConfigInput>;
}

export function GraphQLRootFieldsSection({
  control,
}: GraphQLRootFieldsSectionProps): React.JSX.Element {
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
            <div className="flex items-start gap-1">
              <ToggleItem
                control={control}
                name="graphql.queries.list.enabled"
                disabled={!isObjectTypeEnabled}
                label="List"
                description="Query multiple records, e.g. posts(where: ...)"
              />
              <ListQuerySettingsDialog
                control={control}
                disabled={!isObjectTypeEnabled}
              />
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

function ListQuerySettingsDialog({
  control,
  disabled,
}: {
  control: Control<ModelConfigInput>;
  disabled: boolean;
}): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();

  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });
  const isWhereFilteringEnabled = useWatch({
    control,
    name: 'graphql.queries.list.where.enabled',
  });
  const isOrderByEnabled = useWatch({
    control,
    name: 'graphql.queries.list.orderBy.enabled',
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

  const fieldOptions = exposedFields.map((entry) => ({
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

  const sortableFieldRefs = exposedFields
    .filter((entry) => entry.sortable)
    .map((entry) => entry.ref);

  const onSortableFieldRefsChange = (refs: string[]): void => {
    const refSet = new Set(refs);
    onExposedFieldsChange(
      exposedFields.map((entry) => ({
        ...entry,
        sortable: refSet.has(entry.ref),
      })),
    );
  };

  // A selected field is only safe to filter on if its read access is no
  // narrower than the list query's own roles — see
  // ModelUtils.isFieldSafeToFilter. Surfaced as a warning rather than
  // hidden from the options, so an author isn't left wondering why a field
  // they expect to see is missing from the picker. Rendered inside the
  // dialog, next to the picker that produced it, since that's where the
  // author is actually looking when they select an unsafe field.
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
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            title="Configure list query"
          />
        }
      >
        <MdSettings />
      </DialogTrigger>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Configure List Query</DialogTitle>
          <DialogDescription>
            Enable additional list query capabilities and choose which fields
            each one may operate on.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ToggleItem
            control={control}
            name="graphql.queries.list.count.enabled"
            disabled={!isListEnabled}
            label="Count"
            description="Count matching records, e.g. postsCount(...)"
          />
          <ToggleItem
            control={control}
            name="graphql.queries.list.connection.enabled"
            disabled={!isListEnabled}
            label="Connection"
            description="Cursor-based pagination, e.g. postsConnection(first, after)"
          />
          <ToggleItem
            control={control}
            name="graphql.queries.list.where.enabled"
            disabled={!isListEnabled}
            label="Where Filtering"
            description="Filter records by field values, e.g. posts(where: { title: { contains: ... } })"
          />
          <div className="ml-6 space-y-2">
            <MultiComboboxField
              label="Filterable Fields"
              description="Choose which exposed fields can be used as `where` filter operands."
              placeholder="Select fields..."
              options={fieldOptions}
              value={filterableFieldRefs}
              onChange={onFilterableFieldRefsChange}
              noResultsText="No fields exposed"
              disabled={!isListEnabled || !isWhereFilteringEnabled}
            />
            {isWhereFilteringEnabled &&
              unsafeFilterableFieldNames.length > 0 && (
                <Alert variant="warning">
                  <MdWarning />
                  <AlertTitle>Field roles narrower than the query</AlertTitle>
                  <AlertDescription>
                    {unsafeFilterableFieldNames.join(', ')}{' '}
                    {unsafeFilterableFieldNames.length === 1 ? 'is' : 'are'}{' '}
                    filterable but readable by fewer roles than the query
                    itself, letting a caller infer its value without permission
                    to read it. Match the roles or unselect it above — sync will
                    otherwise fail.
                  </AlertDescription>
                </Alert>
              )}
          </div>
          <ToggleItem
            control={control}
            name="graphql.queries.list.orderBy.enabled"
            disabled={!isListEnabled}
            label="Order By"
            description="Sort records by field values, e.g. posts(orderBy: [{ createdAt: DESC }])"
          />
          <div className="ml-6">
            <MultiComboboxField
              label="Sortable Fields"
              description="Choose which exposed fields can be used as `orderBy` sort keys."
              placeholder="Select fields..."
              options={fieldOptions}
              value={sortableFieldRefs}
              onChange={onSortableFieldRefsChange}
              noResultsText="No fields exposed"
              disabled={!isListEnabled || !isOrderByEnabled}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    | 'graphql.queries.list.orderBy.enabled'
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
