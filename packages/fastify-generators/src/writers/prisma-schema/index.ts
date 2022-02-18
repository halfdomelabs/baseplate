/* eslint-disable max-classes-per-file */
import indentString from 'indent-string';

type PrismaSchemaBlockType = 'datasource' | 'generator' | 'model';

export interface PrismaSchemaBlock {
  name: string;
  type: PrismaSchemaBlockType;
  contents: string;
}

export type PrismaGeneratorBlock = PrismaSchemaBlock & { type: 'generator' };
export type PrismaDatasourceBlock = PrismaSchemaBlock & { type: 'datasource' };
export type PrismaModelBlock = PrismaSchemaBlock & { type: 'model' };

function formatBlock(block: PrismaSchemaBlock): string {
  return `
${block.type} ${block.name} {
${indentString(block.contents, 2)}
}
`.trim();
}

function mapObjectToContents(obj: Record<string, string>): string {
  return Object.keys(obj)
    .map((key) => `${key} = ${obj[key]}`)
    .join('\n');
}

interface PrismaGeneratorBlockOptions {
  name: string;
  provider: string;
  additionalOptions?: Record<string, string>;
}

export function createPrismaSchemaGeneratorBlock({
  name,
  provider,
  additionalOptions,
}: PrismaGeneratorBlockOptions): PrismaGeneratorBlock {
  return {
    name,
    type: 'generator',
    contents: mapObjectToContents({
      ...additionalOptions,
      provider: `"${provider}"`,
    }),
  };
}

interface PrismaDatasourceBlockOptions {
  name: string;
  provider: 'postgresql' | 'mysql' | 'sqlite';
  url: string;
}

export function createPrismaSchemaDatasourceBlock({
  name,
  provider,
  url,
}: PrismaDatasourceBlockOptions): PrismaDatasourceBlock {
  return {
    name,
    type: 'datasource',
    contents: mapObjectToContents({
      provider: `"${provider}"`,
      url,
    }),
  };
}

export class PrismaSchemaFile {
  generatorBlocks: PrismaGeneratorBlock[] = [];

  datasourceBlock: PrismaDatasourceBlock | null = null;

  modelBlocks: PrismaModelBlock[] = [];

  addGeneratorBlock(block: PrismaGeneratorBlock): void {
    this.generatorBlocks.push(block);
  }

  setDatasourceBlock(block: PrismaDatasourceBlock): void {
    this.datasourceBlock = block;
  }

  addModelBlock(block: PrismaModelBlock): void {
    this.modelBlocks.push(block);
  }

  toText(): string {
    if (!this.datasourceBlock) {
      throw new Error(`Datasource block required`);
    }
    return `${[
      ...this.generatorBlocks.map(formatBlock),
      formatBlock(this.datasourceBlock),
      ...this.modelBlocks.map(formatBlock),
    ].join('\n\n')}\n`;
  }
}
