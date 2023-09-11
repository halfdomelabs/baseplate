import _ from 'lodash';

export interface GraphQLArgumentScalarValue {
  type: 'scalar';
  value: string | number | boolean;
}

export interface GraphQLArgumentVariableValue {
  type: 'variable';
  variable: string;
}

export type GraphQLArgumentValue =
  | GraphQLArgumentScalarValue
  | GraphQLArgumentVariableValue;

export interface GraphQLArgument {
  name: string;
  value: GraphQLArgumentValue;
}

export interface GraphQLSimpleField {
  type?: 'simple' | undefined;
  name: string;
  args?: GraphQLArgument[];
  fields?: GraphQLField[];
}

export interface GraphQLSpreadField {
  type: 'spread';
  on: string;
}

export type GraphQLField = GraphQLSimpleField | GraphQLSpreadField;

export interface GraphQLVariable {
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
    case 'scalar':
      switch (typeof value.value) {
        case 'string':
          return `"${value.value}"`;
        case 'number':
        case 'boolean':
          return value.value.toString();
        default:
          throw new Error(
            `Unsupported GraphQL scalar value type: ${typeof value.value}`,
          );
      }
    case 'variable':
      return `$${value.variable}`;
    default:
      throw new Error(
        `Unknown GraphQL value type: ${(value as { type: string }).type}`,
      );
  }
}

function renderGraphQLArgument({ name, value }: GraphQLArgument): string {
  return `${name}: ${renderGraphQLArgumentValue(value)}`;
}

export function renderGraphQLSimpleField({
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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    fieldDefinition += ` {\n${indent(renderGraphQLFields(fields))}\n}`;
  }

  return fieldDefinition;
}

export function renderGraphQLSpreadField({ on }: GraphQLSpreadField): string {
  return `...${on}`;
}

export function renderGraphQLField(field: GraphQLField): string {
  switch (field.type) {
    case undefined:
    case 'simple':
      return renderGraphQLSimpleField(field);
    case 'spread':
      return renderGraphQLSpreadField(field);
    default:
      throw new Error(
        `Unknown GraphQL field type ${(field as { type: string }).type}`,
      );
  }
}

export function renderGraphQLFields(fields: GraphQLField[]): string {
  return fields.map((field) => renderGraphQLField(field)).join('\n');
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

export function areFieldsMergeable(
  fieldOne: GraphQLField,
  fieldTwo: GraphQLField,
): boolean {
  if (isSimpleField(fieldOne) && isSimpleField(fieldTwo)) {
    if (fieldOne.name !== fieldTwo.name) {
      return false;
    }
    // check they match in args
    if (!_.isEqual(fieldOne.args, fieldTwo.args)) {
      throw new Error(
        `Unable to merge fields with different args ${fieldOne.name}`,
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

export function mergeGraphQLFields(fields: GraphQLField[]): GraphQLField[] {
  // FYI: Not Immutable
  return fields.reduce((accumulator, field) => {
    const idx = accumulator.findIndex((accumField) =>
      areFieldsMergeable(accumField, field),
    );
    if (idx === -1) {
      return [...accumulator, field];
    }
    return accumulator.map((accumField, i) => {
      // perform merge operation
      if (idx === i) {
        if (isSimpleField(accumField) && isSimpleField(field)) {
          return {
            ...accumField,
            fields: mergeGraphQLFields([
              ...(accumField.fields ?? []),
              ...(field.fields ?? []),
            ]),
          };
        }
      }
      return accumField;
    });
  }, [] as GraphQLField[]);
}

export function areFragmentsMergeable(
  fragOne: GraphQLFragment,
  fragTwo: GraphQLFragment,
): boolean {
  if (fragOne.name === fragTwo.name) {
    if (fragOne.type !== fragTwo.type) {
      throw new Error(
        `Unable to merge fragments with different types ${fragOne.name}`,
      );
    }
    return true;
  }
  return false;
}

export function mergeGraphQLFragments(
  frags: GraphQLFragment[],
): GraphQLFragment[] {
  // FYI: Not Immutable
  return frags.reduce((accumulator, frag) => {
    const idx = accumulator.findIndex((accumFrag) =>
      areFragmentsMergeable(accumFrag, frag),
    );
    if (idx === -1) {
      return [...accumulator, frag];
    }
    return accumulator.map((accumFrag, i) => {
      // perform merge operation
      if (idx === i) {
        return {
          ...accumFrag,
          fields: mergeGraphQLFields([
            ...(accumFrag.fields ?? []),
            ...(frag.fields ?? []),
          ]),
        };
      }
      return accumFrag;
    });
  }, [] as GraphQLFragment[]);
}

export function areFieldsIdentical(
  fieldsOne: GraphQLField[],
  fieldsTwo: GraphQLField[],
): boolean {
  return _.isEqual(fieldsOne, fieldsTwo);
}
