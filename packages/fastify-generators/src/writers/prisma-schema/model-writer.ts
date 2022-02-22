import { PrismaModelBlock } from './schema';

interface ModelBlockOptions {
  name: string;
  tableName?: string;
}

export interface PrismaModelAttribute {
  name: string;
  args?: string | (string | string[] | Record<string, string | string[]>)[];
}

export interface PrismaModelField {
  name: string;
  type: string;
  attributes?: PrismaModelAttribute[];
}

function formatAttributeArgument(argument: string | string[]): string {
  return Array.isArray(argument) ? `[${argument.join(', ')}]` : argument;
}

function formatAttribute({ args, name }: PrismaModelAttribute): string {
  if (!args) {
    return name;
  }

  const argStrings =
    typeof args === 'string'
      ? [args]
      : args.flatMap((argument) => {
          if (typeof argument === 'string' || Array.isArray(argument)) {
            return formatAttributeArgument(argument);
          }
          return Object.keys(argument).map(
            (key) => `${key}: ${formatAttributeArgument(argument[key])}`
          );
        });

  return `${name}(${argStrings.join(', ')})`;
}

function formatModel({ name, type, attributes }: PrismaModelField): string {
  return [name, type, ...(attributes?.map(formatAttribute) || [])].join(' ');
}

export class PrismaModelBlockWriter {
  fields: PrismaModelField[] = [];

  attributes: PrismaModelAttribute[] = [];

  constructor(private readonly options: ModelBlockOptions) {}

  addField(field: PrismaModelField): this {
    this.fields.push(field);
    return this;
  }

  addAttribute(attribute: PrismaModelAttribute): this {
    this.attributes.push(attribute);
    return this;
  }

  toBlock(): PrismaModelBlock {
    const attributes = [...this.attributes];
    if (this.options.tableName) {
      attributes.push({
        name: '@@map',
        args: `"${this.options.tableName}"`,
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
