import { compareStrings } from '@baseplate-dev/utils';

import type { ScalarFieldType } from '#src/types/field-types.js';
import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import type { PrismaModelBlock } from './types.js';

interface ModelBlockOptions {
  name: string;
  tableName?: string;
}

// TODO: Use https://github.com/MrLeebo/prisma-ast or something like that for proper Prisma schema parsing and generation

export interface PrismaModelAttribute {
  name: string;
  args?: (string | string[] | Record<string, string | string[]>)[];
}

/**
 * A field in a Prisma model.
 */
interface PrismaModelFieldBase {
  /**
   * The name of the field.
   */
  name: string;
  /**
   * The type of the field, e.g. `String`, `User`.
   */
  type: string;
  /**
   * The attributes of the field e.g. `@id` for the primary key, `@relation` for a relation.
   */
  attributes?: PrismaModelAttribute[];
  /**
   * Whether the field is optional.
   */
  isOptional?: boolean;
  /**
   * Whether the field is a list.
   */
  isList?: boolean;
}

interface PrismaModelScalarField extends PrismaModelFieldBase {
  fieldType: 'scalar';
  /**
   * The order of the field in the model list.
   */
  order: number;
  /**
   * The scalar type of the field.
   */
  scalarType: ScalarFieldType;
  /**
   * The enum type of the field.
   */
  enumType?: string;
}

interface PrismaModelRelationField extends PrismaModelFieldBase {
  fieldType: 'relation';
}

export type PrismaModelField =
  | PrismaModelScalarField
  | PrismaModelRelationField;

function formatAttributeArgument(argument: string | string[]): string {
  return Array.isArray(argument) ? `[${argument.join(', ')}]` : argument;
}

function formatAttributeArguments(
  args: Exclude<PrismaModelAttribute['args'], undefined>,
): string {
  const argStrings =
    typeof args === 'string'
      ? [args]
      : args.flatMap((argument) => {
          if (typeof argument === 'string' || Array.isArray(argument)) {
            return formatAttributeArgument(argument);
          }
          return Object.keys(argument).map(
            (key) => `${key}: ${formatAttributeArgument(argument[key])}`,
          );
        });

  return argStrings.join(', ');
}

function formatAttribute({ args, name }: PrismaModelAttribute): string {
  if (!args) {
    return name;
  }

  return `${name}(${formatAttributeArguments(args)})`;
}

function parseArguments(
  attribute: PrismaModelAttribute,
  positionalArgumentNames: string[],
): Record<string, string | string[]> {
  if (!attribute.args) {
    return {};
  }

  const argumentMap: Record<string, string | string[]> = {};

  for (let idx = 0; idx < attribute.args.length; idx++) {
    const arg = attribute.args[idx];
    if (Array.isArray(arg) || typeof arg === 'string') {
      const argName = positionalArgumentNames[idx];
      if (!argName) {
        throw new Error(
          `Must provide positional argument name for ${attribute.name}`,
        );
      }
      argumentMap[argName] = arg;
    } else {
      Object.assign(argumentMap, arg);
    }
  }

  return argumentMap;
}

function formatModelField({
  name,
  type,
  isList,
  isOptional,
  attributes,
}: PrismaModelField): string {
  const typeWithList = isList ? `${type}[]` : type;
  const typeWithOptional = isOptional ? `${typeWithList}?` : typeWithList;
  return [name, typeWithOptional, ...(attributes?.map(formatAttribute) ?? [])]
    .join(' ')
    .trim();
}

export class PrismaModelBlockWriter {
  name: string;

  fields: PrismaModelField[] = [];

  attributes: PrismaModelAttribute[] = [];

  constructor(private readonly options: ModelBlockOptions) {
    this.name = options.name;
  }

  addField(field: PrismaModelField): this {
    this.fields.push(field);
    return this;
  }

  addAttribute(attribute: PrismaModelAttribute): this {
    this.attributes.push(attribute);
    return this;
  }

  private extractIdFields(): string[] | null {
    const singleIdFields = this.fields.filter((field) =>
      field.attributes?.some((attr) => attr.name === '@id'),
    );
    if (singleIdFields.length > 1) {
      throw new Error(`Model ${this.name} has more than one @id field`);
    }

    if (singleIdFields.length > 0) {
      return singleIdFields.map((field) => field.name);
    }

    const idAttribute = this.attributes.find((attr) => attr.name === '@@id');
    if (idAttribute) {
      const args = parseArguments(idAttribute, ['fields']);
      const { fields } = args;
      return Array.isArray(fields) ? fields : [fields];
    }

    return null;
  }

  protected getSortedFields(): PrismaModelField[] {
    const scalarFields = this.fields
      .filter((field) => field.fieldType === 'scalar')
      .sort((a, b) => a.order - b.order);
    const relationFields = this.fields
      .filter((field) => field.fieldType === 'relation')
      .sort((a, b) => compareStrings(a.name, b.name));

    // Look for duplicated orders in scalar fields
    const orderSet = new Set(scalarFields.map((field) => field.order));
    if (orderSet.size !== scalarFields.length) {
      throw new Error(
        `Duplicate order in scalar fields for model ${this.name}`,
      );
    }

    return [...scalarFields, ...relationFields];
  }

  toOutputModel(): PrismaOutputModel {
    const sortedFields = this.getSortedFields();
    return {
      name: this.options.name,
      fields: sortedFields.map((field) => {
        const sharedFields = {
          name: field.name,
          id: field.attributes?.some((attr) => attr.name === '@id') ?? false,
          isOptional: field.isOptional ?? false,
          isList: field.isList ?? false,
          hasDefault:
            field.attributes?.some((attr) => attr.name === '@default') ?? false,
        };
        if (field.fieldType === 'relation') {
          const relationAttribute = field.attributes?.find(
            (attr) => attr.name === '@relation',
          );
          const {
            name: relationName,
            fields,
            references,
          }: Record<string, string | string[]> = relationAttribute
            ? parseArguments(relationAttribute, ['name'])
            : {};
          if (Array.isArray(relationName)) {
            throw new TypeError('Relation name must be string');
          }
          if (typeof fields === 'string' || typeof references === 'string') {
            throw new TypeError('Fields and references must be arrays');
          }
          return {
            type: 'relation',
            modelType: field.type.replaceAll(/[[\]?]+$/g, ''),
            relationName,
            fields,
            references,
            ...sharedFields,
          };
        }
        return {
          type: 'scalar',
          scalarType: field.scalarType,
          enumType: field.enumType,
          order: field.order,
          ...sharedFields,
        };
      }),
      idFields: this.extractIdFields(),
    };
  }

  toBlock(): PrismaModelBlock {
    const sortedFields = this.getSortedFields();
    const attributes = [...this.attributes];
    if (this.options.tableName) {
      attributes.push({
        name: '@@map',
        args: [`"${this.options.tableName}"`],
      });
    }

    const fieldsString = sortedFields.map(formatModelField).join('\n');
    const modelAttributeString = attributes.map(formatAttribute).join('\n');

    return {
      name: this.options.name,
      type: 'model',
      contents: [fieldsString, modelAttributeString]
        .filter(Boolean)
        .join('\n\n'),
    };
  }
}
