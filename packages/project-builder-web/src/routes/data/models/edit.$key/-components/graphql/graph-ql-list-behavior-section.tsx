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
  InputFieldController,
  MultiComboboxField,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SelectField,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { lowerFirst } from 'es-toolkit';
import { pluralize } from 'inflection';
import { useController, useWatch } from 'react-hook-form';
import { MdAdd, MdClose, MdWarning } from 'react-icons/md';

import { useOriginalModel } from '../../../-hooks/use-original-model.js';

const DIRECTION_OPTIONS = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

interface GraphQLListBehaviorSectionProps {
  control: Control<ModelConfigInput>;
}

/**
 * Parses an optional numeric input. `valueAsNumber` yields NaN for an empty
 * field, which would fail validation instead of clearing the limit.
 */
function toOptionalNumber(value: unknown): number | undefined {
  return value === '' || value === null || value === undefined
    ? undefined
    : Number(value);
}

/**
 * Model-level configuration shared by every surface that returns a list of this
 * model — the list and connection queries, and list relations on other models.
 * Ordering, filtering, and page size all live here because each applies to all
 * of those surfaces; only the root fields themselves are toggled per-query.
 */
export function GraphQLListBehaviorSection({
  control,
}: GraphQLListBehaviorSectionProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const { name: modelName } = useOriginalModel();

  // Mirrors the query name the generator derives from the model name.
  const listQueryName = pluralize(lowerFirst(modelName));

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });
  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });
  const isConnectionEnabled = useWatch({
    control,
    name: 'graphql.queries.connection.enabled',
  });
  const isOrderByEnabled = useWatch({
    control,
    name: 'graphql.queries.orderBy.enabled',
  });
  const isWhereFilteringEnabled = useWatch({
    control,
    name: 'graphql.queries.where.enabled',
  });
  const hasListSurface = ModelUtils.hasListSurface({
    list: { enabled: isListEnabled ?? false },
    connection: { enabled: isConnectionEnabled ?? false },
  });
  const exposedFields =
    useWatch({ control, name: 'graphql.objectType.fields' }) ?? [];
  const queryGlobalRoles = useWatch({
    control,
    name: 'graphql.queries.globalRoles',
  });
  const queryInstanceRoles = useWatch({
    control,
    name: 'graphql.queries.instanceRoles',
  });

  const {
    field: { value: sortableFields = [], onChange: onSortableFieldsChange },
  } = useController({ control, name: 'graphql.orderBy.fields' });
  const {
    field: { value: defaultSort = [], onChange: onDefaultSortChange },
  } = useController({ control, name: 'graphql.orderBy.defaultSort' });
  const {
    field: { value: filterableFields = [], onChange: onFilterableFieldsChange },
  } = useController({ control, name: 'graphql.where.fields' });

  const fieldOptions = exposedFields.map((entry) => ({
    label: definitionContainer.nameFromId(entry.ref),
    value: entry.ref,
  }));

  // A selected field is only safe to filter on if its read access is no
  // narrower than the query's own roles — see ModelUtils.isFieldSafeToFilter.
  // Surfaced as a warning rather than hidden from the options, so an author
  // isn't left wondering why a field they expect to see is missing.
  const unsafeFilterableFieldNames = filterableFields
    .map((ref) => exposedFields.find((entry) => entry.ref === ref))
    .filter((entry) => entry !== undefined)
    .filter(
      (entry) =>
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

  const usedDefaultSortRefs = new Set(defaultSort.map((entry) => entry.ref));
  const availableDefaultSortOptions = fieldOptions.filter(
    (option) => !usedDefaultSortRefs.has(option.value),
  );

  function updateDefaultSortEntry(
    index: number,
    changes: Partial<{ ref: string; direction: 'asc' | 'desc' }>,
  ): void {
    onDefaultSortChange(
      defaultSort.map((entry, i) =>
        i === index ? { ...entry, ...changes } : entry,
      ),
    );
  }

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>List Behavior</SectionListSectionTitle>
          <SectionListSectionDescription>
            Shared by every query that returns a list of {modelName} — the{' '}
            <code>{listQueryName}</code> and{' '}
            <code>{listQueryName}Connection</code> queries, and any {modelName}{' '}
            list relation on another model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold">Ordering</p>
          <div className="space-y-1">
            <SwitchFieldController
              control={control}
              name="graphql.queries.orderBy.enabled"
              disabled={!isObjectTypeEnabled || !hasListSurface}
              label="Order By"
            />
            <p className="text-xs text-muted-foreground">
              Let callers choose the sort, e.g.{' '}
              <code>
                {listQueryName}(orderBy: [{'{'} createdAt: DESC {'}'}])
              </code>
            </p>
          </div>
          {(isOrderByEnabled ?? false) && sortableFields.length === 0 && (
            <Alert variant="warning">
              <MdWarning />
              <AlertTitle>No sortable fields selected</AlertTitle>
              <AlertDescription>
                Choose sortable fields below — sync will otherwise fail.
              </AlertDescription>
            </Alert>
          )}
          <MultiComboboxField
            label="Sortable Fields"
            description="Fields the caller can choose to sort by, overriding the default sort. Only used where ordering is turned on."
            placeholder="Select fields..."
            options={fieldOptions}
            value={sortableFields}
            onChange={onSortableFieldsChange}
            noResultsText="No fields exposed"
            disabled={!isObjectTypeEnabled}
          />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Default Sort</p>
            <p className="text-xs text-muted-foreground">
              The order results come back in when nothing else is requested.
              Without one, rows come back in an arbitrary order. Works on its
              own — a model can have a default sort without letting callers
              choose their own.
            </p>
          </div>
          {defaultSort.map((entry, index) => (
            <div key={entry.ref} className="flex items-center gap-2">
              <SelectField
                className="flex-1"
                options={fieldOptions.filter(
                  (option) =>
                    option.value === entry.ref ||
                    !usedDefaultSortRefs.has(option.value),
                )}
                value={entry.ref}
                onChange={(ref) => {
                  if (ref !== null) {
                    updateDefaultSortEntry(index, { ref });
                  }
                }}
                disabled={!isObjectTypeEnabled}
              />
              <SelectField
                className="w-40"
                options={DIRECTION_OPTIONS}
                value={entry.direction ?? 'asc'}
                onChange={(direction) => {
                  if (direction === 'asc' || direction === 'desc') {
                    updateDefaultSortEntry(index, { direction });
                  }
                }}
                disabled={!isObjectTypeEnabled}
              />
              <Button
                variant="ghost"
                size="icon-lg"
                title="Remove sort key"
                disabled={!isObjectTypeEnabled}
                onClick={() => {
                  onDefaultSortChange(
                    defaultSort.filter((_, i) => i !== index),
                  );
                }}
              >
                <MdClose />
              </Button>
            </div>
          ))}
          {defaultSort.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No default sort — {listQueryName} come back in an arbitrary order.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={
              !isObjectTypeEnabled || availableDefaultSortOptions.length === 0
            }
            onClick={() => {
              const firstOption = availableDefaultSortOptions[0];
              if (!firstOption) {
                return;
              }
              onDefaultSortChange([
                ...defaultSort,
                {
                  ref: firstOption.value,
                  direction: 'asc',
                },
              ]);
            }}
          >
            <MdAdd />
            Add sort key
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold">Filtering</p>
          <div className="space-y-1">
            <SwitchFieldController
              control={control}
              name="graphql.queries.where.enabled"
              disabled={!isObjectTypeEnabled || !hasListSurface}
              label="Where Filtering"
            />
            <p className="text-xs text-muted-foreground">
              Let callers narrow results by field value, e.g.{' '}
              <code>
                {listQueryName}(where: {'{'} title: {'{'} contains: ... {'}'}{' '}
                {'}'})
              </code>
            </p>
          </div>
          {(isWhereFilteringEnabled ?? false) &&
            filterableFields.length === 0 && (
              <Alert variant="warning">
                <MdWarning />
                <AlertTitle>No filterable fields selected</AlertTitle>
                <AlertDescription>
                  Choose filterable fields below — sync will otherwise fail.
                </AlertDescription>
              </Alert>
            )}
          <MultiComboboxField
            label="Filterable Fields"
            description="Fields the caller can narrow results by, e.g. only rows where status matches. Only used where filtering is turned on."
            placeholder="Select fields..."
            options={fieldOptions}
            value={filterableFields}
            onChange={onFilterableFieldsChange}
            noResultsText="No fields exposed"
            disabled={!isObjectTypeEnabled}
          />
          {unsafeFilterableFieldNames.length > 0 && (
            <Alert variant="warning">
              <MdWarning />
              <AlertTitle>Field roles narrower than the query</AlertTitle>
              <AlertDescription>
                {unsafeFilterableFieldNames.join(', ')}{' '}
                {unsafeFilterableFieldNames.length === 1 ? 'is' : 'are'}{' '}
                filterable but readable by fewer roles than the query itself,
                letting a caller infer its value without permission to read it.
                Match the roles or unselect it above — sync will otherwise fail.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Pagination</p>
            <p className="text-xs text-muted-foreground">
              Limits how many {listQueryName} a single page may return, so large
              objects aren&apos;t fetched en masse. Leave blank to use the
              defaults — unbounded for <code>{listQueryName}</code>, 20 per page
              (100 max) for <code>{listQueryName}Connection</code>.
            </p>
          </div>
          <div className="grid max-w-lg grid-cols-2 gap-4">
            <InputFieldController
              control={control}
              name="graphql.pagination.defaultPageSize"
              disabled={!isObjectTypeEnabled}
              label="Default page size"
              type="number"
              min={1}
              placeholder="Default"
              registerOptions={{ setValueAs: toOptionalNumber }}
              description="Applied when the caller requests no size. Falls back to the max if only that is set."
            />
            <InputFieldController
              control={control}
              name="graphql.pagination.maxPageSize"
              disabled={!isObjectTypeEnabled}
              label="Max page size"
              type="number"
              min={1}
              placeholder="Default"
              registerOptions={{ setValueAs: toOptionalNumber }}
              description="Largest page a caller may request"
            />
          </div>
        </div>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
