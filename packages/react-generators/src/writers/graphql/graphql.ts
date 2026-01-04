/**
 * Core GraphQL types and rendering utilities.
 * These types are library-agnostic and can be used with any GraphQL code generation approach.
 */

import { isEqual, sortBy } from 'es-toolkit';

// ============================================================================
// Argument Types
// ============================================================================

interface GraphQLScalarValue {
  type: 'scalar';
  value: string | number | boolean;
}

interface GraphQLVariableValue {
  type: 'variable';
  variable: string;
}

export type GraphQLArgumentValue = GraphQLScalarValue | GraphQLVariableValue;

export interface GraphQLArgument {
  name: string;
  value: GraphQLArgumentValue;
}

// ============================================================================
// Variable Types
// ============================================================================

export interface GraphQLVariable {
  name: string;
  type: string;
}

// ============================================================================
// Fragment Types
// ============================================================================

/**
 * Represents a GraphQL fragment definition.
 *
 * @example
 * ```typescript
 * const userRowFragment: GraphQLFragment = {
 *   variableName: 'userRowFragment',
 *   fragmentName: 'UserTable_items',
 *   onType: 'User',
 *   fields: [{ name: 'id' }, { name: 'email' }],
 *   path: './user-table.tsx',
 * };
 * ```
 */
export interface GraphQLFragment {
  /** Variable name in generated code (e.g., "userRowFragment") */
  variableName: string;
  /** Fragment name in GraphQL (e.g., "UserTable_items") */
  fragmentName: string;
  /** GraphQL type the fragment applies to (e.g., "User") */
  onType: string;
  /** Fields to include in the fragment */
  fields: GraphQLField[];
  /** Path where this fragment is defined (for imports) */
  path: string;
}

// ============================================================================
// Field Types
// ============================================================================

/**
 * A simple field with a name, optional arguments, and optional nested fields.
 */
export interface GraphQLSimpleField {
  type?: 'simple' | undefined;
  name: string;
  args?: GraphQLArgument[];
  fields?: GraphQLField[];
  /** Used for sorting fields in output */
  order?: number;
}

/**
 * A fragment spread that references a GraphQLFragment.
 * This enables automatic dependency tracking and import generation.
 *
 * @example
 * ```typescript
 * const field: GraphQLSpreadField = {
 *   type: 'spread',
 *   fragment: userRowFragment,
 * };
 * // Renders as: ...UserTable_items
 * ```
 */
export interface GraphQLSpreadField {
  type: 'spread';
  fragment: GraphQLFragment;
}

export type GraphQLField = GraphQLSimpleField | GraphQLSpreadField;

// ============================================================================
// Operation Types
// ============================================================================

/**
 * Represents a GraphQL operation (query, mutation, or subscription).
 *
 * @example
 * ```typescript
 * const usersQuery: GraphQLOperation = {
 *   type: 'query',
 *   variableName: 'usersQuery',
 *   operationName: 'Users',
 *   fields: [{
 *     name: 'users',
 *     fields: [{ type: 'spread', fragment: userRowFragment }],
 *   }],
 * };
 * ```
 */
export interface GraphQLOperation {
  type: 'query' | 'mutation' | 'subscription';
  /** Variable name in generated code (e.g., "usersQuery") */
  variableName: string;
  /** Operation name in GraphQL (e.g., "Users") */
  operationName: string;
  /** GraphQL variables for the operation */
  variables?: GraphQLVariable[];
  /** Fields to include in the operation */
  fields: GraphQLField[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isSimpleField(
  field: GraphQLField,
): field is GraphQLSimpleField {
  return field.type === 'simple' || field.type === undefined;
}

export function isSpreadField(
  field: GraphQLField,
): field is GraphQLSpreadField {
  return field.type === 'spread';
}

// ============================================================================
// Rendering Utilities
// ============================================================================

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => line && `  ${line}`)
    .join('\n');
}

function renderArgumentValue(value: GraphQLArgumentValue): string {
  switch (value.type) {
    case 'scalar': {
      switch (typeof value.value) {
        case 'string': {
          return `"${value.value}"`;
        }
        case 'number':
        case 'boolean': {
          return value.value.toString();
        }
        default: {
          throw new Error(
            `Unsupported GraphQL scalar value type: ${typeof value.value}`,
          );
        }
      }
    }
    case 'variable': {
      return `$${value.variable}`;
    }
    default: {
      throw new Error(
        `Unknown GraphQL value type: ${(value as { type: string }).type}`,
      );
    }
  }
}

function renderArgument({ name, value }: GraphQLArgument): string {
  return `${name}: ${renderArgumentValue(value)}`;
}

function renderSimpleField({ name, args, fields }: GraphQLSimpleField): string {
  let fieldDefinition = name;

  if (args?.length) {
    fieldDefinition += `(${args.map((arg) => renderArgument(arg)).join(', ')})`;
  }

  if (fields?.length) {
    fieldDefinition += ` {\n${indent(renderFields(fields))}\n}`;
  }

  return fieldDefinition;
}

function renderSpreadField(field: GraphQLSpreadField): string {
  return `...${field.fragment.fragmentName}`;
}

function renderField(field: GraphQLField): string {
  if (isSpreadField(field)) {
    return renderSpreadField(field);
  }
  return renderSimpleField(field);
}

/**
 * Renders an array of GraphQL fields to a string.
 * Fields are sorted by: simple fields first, then spread fields, then nested fields.
 */
export function renderFields(fields: GraphQLField[]): string {
  const sortedFields = sortBy(fields, [
    // Sort by: simple fields, spread fields, then nested fields
    (f) => {
      if (isSpreadField(f)) return 1;
      if (isSimpleField(f) && f.fields?.length) return 2;
      return 0;
    },
    // Sort by order if provided
    (f) => (isSimpleField(f) ? (f.order ?? 0) : 0),
    // Sort by name/fragment name
    (f) => (isSpreadField(f) ? f.fragment.fragmentName : f.name),
  ]);
  return sortedFields.map((field) => renderField(field)).join('\n');
}

function renderVariable({ name, type }: GraphQLVariable): string {
  return `$${name}: ${type}`;
}

/**
 * Renders a GraphQL fragment definition to a string.
 */
export function renderFragment(fragment: GraphQLFragment): string {
  return `fragment ${fragment.fragmentName} on ${fragment.onType} {
${indent(renderFields(fragment.fields))}
}`;
}

/**
 * Renders a GraphQL operation (query/mutation/subscription) to a string.
 */
export function renderOperation(operation: GraphQLOperation): string {
  let opString = operation.type;

  if (operation.operationName) {
    opString += ` ${operation.operationName}`;
  }

  if (operation.variables?.length) {
    opString += `(${operation.variables.map((v) => renderVariable(v)).join(', ')})`;
  }

  opString += ` {\n${indent(renderFields(operation.fields))}\n}`;

  return opString;
}

// ============================================================================
// Field Merging Utilities
// ============================================================================

/**
 * Checks if two fields are mergeable (same name/fragment with compatible args).
 */
function areFieldsMergeable(
  fieldOne: GraphQLField,
  fieldTwo: GraphQLField,
): boolean {
  if (isSimpleField(fieldOne) && isSimpleField(fieldTwo)) {
    if (fieldOne.name !== fieldTwo.name) {
      return false;
    }
    if (!isEqual(fieldOne.args, fieldTwo.args)) {
      throw new Error(
        `Unable to merge fields with different args: ${fieldOne.name}`,
      );
    }
    return true;
  }

  if (isSpreadField(fieldOne) && isSpreadField(fieldTwo)) {
    return fieldOne.fragment.fragmentName === fieldTwo.fragment.fragmentName;
  }

  return false;
}

/**
 * Merges an array of GraphQL fields, combining fields with the same name.
 */
export function mergeGraphqlFields(fields: GraphQLField[]): GraphQLField[] {
  const mergedFields: GraphQLField[] = [];

  for (const field of fields) {
    const existingField = mergedFields.find((f) =>
      areFieldsMergeable(f, field),
    );

    if (existingField && isSimpleField(existingField) && isSimpleField(field)) {
      existingField.fields = mergeGraphqlFields([
        ...(existingField.fields ?? []),
        ...(field.fields ?? []),
      ]);
    } else if (!existingField) {
      mergedFields.push(field);
    }
  }

  return mergedFields;
}

/**
 * Checks if two arrays of GraphQL fields are identical.
 */
export function areFieldsIdentical(
  fieldsOne: GraphQLField[],
  fieldsTwo: GraphQLField[],
): boolean {
  return isEqual(fieldsOne, fieldsTwo);
}

// ============================================================================
// Dependency Collection
// ============================================================================

/**
 * Collects all GraphQLFragment dependencies from a list of fields.
 * Walks the field tree recursively to find all spread fields.
 */
export function collectFragmentDependencies(
  fields: GraphQLField[],
): GraphQLFragment[] {
  const fragments: GraphQLFragment[] = [];
  const seen = new Set<string>();

  function walk(fieldList: GraphQLField[]): void {
    for (const field of fieldList) {
      if (isSpreadField(field)) {
        if (!seen.has(field.fragment.variableName)) {
          seen.add(field.fragment.variableName);
          fragments.push(field.fragment);
        }
      } else if (field.fields) {
        walk(field.fields);
      }
    }
  }

  walk(fields);
  return fragments;
}
