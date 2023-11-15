import { PrismaModelBlock } from './types.js';
import { ScalarFieldType } from '@src/types/fieldTypes.js';
import { PrismaOutputModel } from '@src/types/prismaOutput.js';

interface ModelBlockOptions {
  name: string;
  tableName?: string;
}

// TODO: Use https://github.com/MrLeebo/prisma-ast or something like that for proper Prisma schema parsing and generation

export interface PrismaModelAttribute {
  name: string;
  args?: (string | string[] | Record<string, string | string[]>)[];
}

export interface PrismaModelField {
  name: string;
  type: string;
  attributes?: PrismaModelAttribute[];
  fieldType: 'scalar' | 'relation';
  scalarType?: ScalarFieldType;
  enumType?: string;
}

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

  return attribute.args.reduce(
    (argumentMap: Record<string, string | string[]>, arg, idx) => {
      if (Array.isArray(arg) || typeof arg === 'string') {
        const argName = positionalArgumentNames[idx];
        if (!argName) {
          throw new Error(
            `Must provide positional argument name for ${attribute.name}`,
          );
        }
        return { ...argumentMap, [argName]: arg };
      }
      return { ...argumentMap, ...arg };
    },
    {},
  );
}

function formatModel({ name, type, attributes }: PrismaModelField): string {
  return [name, type, ...(attributes?.map(formatAttribute) ?? [])].join(' ');
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
    const singleIdFields = this.fields.filter(
      (field) => field.attributes?.some((attr) => attr.name === '@id'),
    );
    if (singleIdFields.length > 1) {
      throw new Error(`Model ${this.name} has more than one @id field`);
    }

    if (singleIdFields.length) {
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

  toOutputModel(): PrismaOutputModel {
    return {
      name: this.options.name,
      fields: this.fields.map((field) => {
        const sharedFields = {
          name: field.name,
          id: field.attributes?.some((attr) => attr.name === '@id') || false,
          isOptional: field.type.endsWith('?'),
          isList: /\[\]\??$/.test(field.type),
          hasDefault:
            field.attributes?.some((attr) => attr.name === '@default') || false,
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
            throw new Error('Relation name must be string');
          }
          if (typeof fields === 'string' || typeof references === 'string') {
            throw new Error('Fields and references must be arrays');
          }
          return {
            type: 'relation',
            modelType: field.type.replace(/[[\]?]+$/g, ''),
            relationName,
            fields,
            references,
            ...sharedFields,
          };
        }
        if (!field.scalarType) {
          throw new Error('Scalar type not set for scalar field');
        }
        return {
          type: 'scalar',
          scalarType: field.scalarType,
          enumType: field.enumType,
          ...sharedFields,
        };
      }),
      idFields: this.extractIdFields(),
    };
  }

  toBlock(): PrismaModelBlock {
    const attributes = [...this.attributes];
    if (this.options.tableName) {
      attributes.push({
        name: '@@map',
        args: [`"${this.options.tableName}"`],
      });
    }

    const fieldsString = this.fields.map(formatModel).join('\n');
    const modelAttributeString = attributes.map(formatAttribute).join('\n');

    return {
      name: this.options.name,
      type: 'model',
      contents: [fieldsString, modelAttributeString]
        .filter((x) => x)
        .join('\n\n'),
    };
  }
}
