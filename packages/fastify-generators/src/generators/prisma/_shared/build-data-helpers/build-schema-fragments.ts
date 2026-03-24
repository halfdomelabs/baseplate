import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type { InputFieldDefinitionOutput } from '../field-definition-generators/types.js';

/**
 * Builds a Zod schema entries object from field definitions.
 * Returns a TsCodeFragment for `{ field1: z.string(), field2: z.number(), ... }`.
 *
 * @param fields - The field definitions to build from
 * @param options - Optional configuration
 * @returns TsCodeFragment for the schema entries object
 */
export function buildFieldSchemasObject(
  fields: InputFieldDefinitionOutput[],
  options?: { disableSort?: boolean },
): TsCodeFragment {
  return TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      fields.map((field) => [field.name, field.schemaFragment]),
    ),
    { disableSort: options?.disableSort },
  );
}

/**
 * Returns a fragment that picks a subset of fields from a Zod schema,
 * or the schema directly if all fields are used.
 *
 * Uses Zod's native `.pick()` for type-safe subsetting.
 *
 * @param fieldNames - The field names to include (undefined means all)
 * @param allFieldNames - All available field names
 * @param zodSchemaFragment - The Zod schema variable/fragment to pick from
 * @returns TsCodeFragment with `.pick({...})` for subsets, or the original fragment
 */
export function pickZodSchemaSubset(
  fieldNames: string[] | undefined,
  allFieldNames: string[],
  zodSchemaFragment: TsCodeFragment | string,
): TsCodeFragment | string {
  const usesAllFields =
    !fieldNames ||
    (fieldNames.length === allFieldNames.length &&
      fieldNames.every((n) => allFieldNames.includes(n)));

  if (usesAllFields) {
    return zodSchemaFragment;
  }

  const pickEntries = fieldNames.map((n) => `${n}: true`).join(', ');
  return tsTemplate`${zodSchemaFragment}.pick({ ${pickEntries} })`;
}

interface BuildNestedSchemaFragmentsConfig {
  /** The field definitions used by this nested relation */
  fields: InputFieldDefinitionOutput[];
  /** The field names used by this nested relation */
  fieldNames: string[];
  /** Whether this is a list relation (one-to-many) */
  isList: boolean;
  /** Import fragment for the nested model's fieldSchemas ZodObject (when data service exists) */
  nestedFieldSchemasFragment?: TsCodeFragment;
  /** All field names in the nested model's data service (for subset detection) */
  allDataServiceFieldNames?: string[];
}

interface NestedSchemaFragments {
  /** The item-level schema (for transformer `schema:` config) */
  itemSchema: TsCodeFragment;
  /** The wrapped schema (for parent's fieldSchemas entry — array/nullish wrapped) */
  schemaFragment: TsCodeFragment;
}

/**
 * Builds the schema fragments for a nested relation.
 *
 * Two cases:
 * 1. **Has fieldSchemas import** → `fieldSchemas` or `fieldSchemas.pick({...})`
 * 2. **No data service** → inline `z.object({ field1: z.string(), ... })`
 *
 * Returns `{ itemSchema, schemaFragment }` where `schemaFragment` is wrapped
 * with `z.array(...).optional()` (list) or `.nullish()` (one-to-one).
 *
 * @param config - Configuration for building the schema
 * @returns The item-level schema and the wrapped schema fragment
 */
export function buildNestedSchemaFragments(
  config: BuildNestedSchemaFragmentsConfig,
): NestedSchemaFragments {
  const {
    fields,
    fieldNames,
    isList,
    nestedFieldSchemasFragment,
    allDataServiceFieldNames,
  } = config;

  const zFrag = TsCodeUtils.importFragment('z', 'zod');
  let itemSchema: TsCodeFragment;

  if (nestedFieldSchemasFragment) {
    // Has data service — fieldSchemas is already a ZodObject, use .pick() for subsets
    const schemasExpression = pickZodSchemaSubset(
      fieldNames,
      allDataServiceFieldNames ?? [],
      nestedFieldSchemasFragment,
    );
    itemSchema = tsTemplate`${schemasExpression}`;
  } else {
    // No data service — build inline from field definitions
    const schemaEntries = buildFieldSchemasObject(fields);
    itemSchema = tsTemplate`${zFrag}.object(${schemaEntries})`;
  }

  // Wrap for the parent's fieldSchemas entry
  const schemaFragment = isList
    ? tsTemplate`${zFrag}.array(${itemSchema}).optional()`
    : tsTemplate`${itemSchema}.nullish()`;

  return { itemSchema, schemaFragment };
}
