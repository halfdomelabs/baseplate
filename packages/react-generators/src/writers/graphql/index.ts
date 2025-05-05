import { isEqual, sortBy } from 'es-toolkit';

interface GraphQLArgumentScalarValue {
  type: 'scalar';
  value: string | number | boolean;
}

interface GraphQLArgumentVariableValue {
  type: 'variable';
  variable: string;
}

type GraphQLArgumentValue =
  | GraphQLArgumentScalarValue
  | GraphQLArgumentVariableValue;

interface GraphQLArgument {
  name: string;
  value: GraphQLArgumentValue;
}

interface GraphQLSimpleField {
  type?: 'simple' | undefined;
  name: string;
  args?: GraphQLArgument[];
  fields?: GraphQLField[];
  order?: number;
}

interface GraphQLSpreadField {
  type: 'spread';
  on: string;
}

export type GraphQLField = GraphQLSimpleField | GraphQLSpreadField;

interface GraphQLVariable {
  name: string;
  type: string;
}

export interface GraphQLRoot {
  type: 'query' | 'mutation' | 'subscription';
  name?: string;
  variables?: GraphQLVariable[];
  fields: GraphQLField[];
}

export interface GraphQLFragment {
  name: string;
  type: string;
  fields: GraphQLField[];
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => line && `  ${line}`)
    .join('\n');
}

function renderGraphQLArgumentValue(value: GraphQLArgumentValue): string {
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

function renderGraphQLArgument({ name, value }: GraphQLArgument): string {
  return `${name}: ${renderGraphQLArgumentValue(value)}`;
}

function renderGraphQLSimpleField({
  name,
  args,
  fields,
}: GraphQLSimpleField): string {
  let fieldDefinition = name;

  if (args?.length) {
    fieldDefinition += `(${args
      .map((arg) => renderGraphQLArgument(arg))
      .join(', ')})`;
  }

  if (fields?.length) {
    // recursive

    fieldDefinition += ` {\n${indent(renderGraphQLFields(fields))}\n}`;
  }

  return fieldDefinition;
}

function renderGraphQLSpreadField({ on }: GraphQLSpreadField): string {
  return `...${on}`;
}

function renderGraphQLField(field: GraphQLField): string {
  switch (field.type) {
    case undefined:
    case 'simple': {
      return renderGraphQLSimpleField(field);
    }
    case 'spread': {
      return renderGraphQLSpreadField(field);
    }
    default: {
      throw new Error(
        `Unknown GraphQL field type ${(field as { type: string }).type}`,
      );
    }
  }
}

function renderGraphQLFields(fields: GraphQLField[]): string {
  const sortedFields = sortBy(fields, [
    // Sort by simple fields, spread fields, and then nested fields
    (f) => {
      if (f.type === 'spread') return 1;
      if (f.fields?.length) return 2;
      return 0;
    },
    // Sort by order if provided
    (f) => (f.type === 'spread' ? 0 : (f.order ?? 0)),
    // Sort by name otherwise
    (f) => (f.type === 'spread' ? f.on : f.name),
  ]);
  return sortedFields.map((field) => renderGraphQLField(field)).join('\n');
}

export function renderGraphQLFragment({
  name,
  type,
  fields,
}: GraphQLFragment): string {
  return `fragment ${name} on ${type} {
${indent(renderGraphQLFields(fields))}
}`;
}

function renderGraphQLVariable({ name, type }: GraphQLVariable): string {
  return `$${name}: ${type}`;
}

export function renderGraphQLRoot({
  type,
  name,
  variables,
  fields,
}: GraphQLRoot): string {
  let rootString = type;
  if (name) {
    rootString += ` ${name}`;
  }
  if (variables?.length) {
    rootString += `(${variables
      .map((variable) => renderGraphQLVariable(variable))
      .join(', ')})`;
  }
  rootString += ` {\n${indent(renderGraphQLFields(fields))}\n}`;

  return rootString;
}

function isSimpleField(field: GraphQLField): field is GraphQLSimpleField {
  return field.type === 'simple' || field.type === undefined;
}

/**
 * Checks if two `GraphQLField` objects are mergeable.
 *
 * A mergeable pair of fields must either:
 * - Be simple fields with the same name and identical arguments, or
 * - Be of type 'spread' with the same `on` property value.
 *
 * @param fieldOne - The first GraphQL field.
 * @param fieldTwo - The second GraphQL field.
 * @returns `true` if the fields are mergeable; otherwise, `false`.
 * @throws If simple fields have different arguments or an unknown field type is encountered.
 */
function areFieldsMergeable(
  fieldOne: GraphQLField,
  fieldTwo: GraphQLField,
): boolean {
  if (isSimpleField(fieldOne) && isSimpleField(fieldTwo)) {
    if (fieldOne.name !== fieldTwo.name) {
      return false;
    }
    // Check if arguments are identical
    if (!isEqual(fieldOne.args, fieldTwo.args)) {
      throw new Error(
        `Unable to merge fields with different args: ${fieldOne.name}`,
      );
    }
    return true;
  }
  if (fieldOne.type === 'spread' && fieldTwo.type === 'spread') {
    return fieldOne.on === fieldTwo.on;
  }
  if (fieldOne.type !== fieldTwo.type) {
    return false;
  }
  throw new Error(`Unknown type: ${fieldOne.type as string}`);
}

/**
 * Merges an array of `GraphQLField` objects, combining any mergeable fields.
 *
 * This function iterates through the input fields, merging entries that are determined to be mergeable
 * based on `areFieldsMergeable`. Non-mergeable fields are added directly to the result.
 *
 * @param fields - An array of `GraphQLField` objects to merge.
 * @returns An array of merged `GraphQLField` objects.
 */
export function mergeGraphQLFields(fields: GraphQLField[]): GraphQLField[] {
  const mergedFields: GraphQLField[] = [];

  for (const field of fields) {
    // Find an existing field in the merged results that is mergeable with the current field
    const existingField = mergedFields.find((accumField) =>
      areFieldsMergeable(accumField, field),
    );

    if (existingField && isSimpleField(existingField) && isSimpleField(field)) {
      // Merge the `fields` property if both fields are simple
      existingField.fields = mergeGraphQLFields([
        ...(existingField.fields ?? []),
        ...(field.fields ?? []),
      ]);
    } else {
      // If no mergeable field is found, add the current field to the result
      mergedFields.push(field);
    }
  }

  return mergedFields;
}
/**
 * Checks if two `GraphQLFragment` objects are mergeable.
 *
 * Two fragments are considered mergeable if they have the same name and type.
 * If the names match but the types differ, an error is thrown.
 *
 * @param fragOne - The first GraphQL fragment.
 * @param fragTwo - The second GraphQL fragment.
 * @returns `true` if the fragments are mergeable; otherwise, `false`.
 * @throws If fragments have the same name but different types.
 */
function areFragmentsMergeable(
  fragOne: GraphQLFragment,
  fragTwo: GraphQLFragment,
): boolean {
  if (fragOne.name === fragTwo.name) {
    if (fragOne.type !== fragTwo.type) {
      throw new Error(
        `Unable to merge fragments with different types: ${fragOne.name}`,
      );
    }
    return true;
  }
  return false;
}

/**
 * Merges an array of `GraphQLFragment` objects, combining any mergeable fragments.
 *
 * This function iterates through the input fragments and merges entries that are determined to be
 * mergeable based on `areFragmentsMergeable`. If fragments are mergeable, their `fields` are merged
 * using `mergeGraphQLFields`. Non-mergeable fragments are added directly to the result.
 *
 * @param frags - An array of `GraphQLFragment` objects to merge.
 * @returns An array of merged `GraphQLFragment` objects.
 */
export function mergeGraphQLFragments(
  frags: GraphQLFragment[],
): GraphQLFragment[] {
  const mergedFragments: GraphQLFragment[] = [];

  for (const frag of frags) {
    // Find an existing fragment in the merged results that is mergeable with the current fragment
    const existingFrag = mergedFragments.find((accumFrag) =>
      areFragmentsMergeable(accumFrag, frag),
    );

    if (existingFrag) {
      // Merge the `fields` property if the fragments are mergeable
      existingFrag.fields = mergeGraphQLFields([
        ...existingFrag.fields,
        ...frag.fields,
      ]);
    } else {
      // If no mergeable fragment is found, add the current fragment to the result
      mergedFragments.push(frag);
    }
  }

  return mergedFragments;
}

export function areFieldsIdentical(
  fieldsOne: GraphQLField[],
  fieldsTwo: GraphQLField[],
): boolean {
  return isEqual(fieldsOne, fieldsTwo);
}
