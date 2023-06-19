/* eslint-disable max-classes-per-file */
import indentString from 'indent-string';
import R from 'ramda';
import { PrismaOutputEnum, PrismaOutputModel } from '@src/types/prismaOutput.js';
import { PrismaModelBlockWriter } from './model-writer.js';
import {
  PrismaDatasourceBlock,
  PrismaEnumBlock,
  PrismaGeneratorBlock,
  PrismaSchemaBlock,
} from './types.js';

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

function printEnumBlock(block: PrismaOutputEnum): PrismaEnumBlock {
  return {
    type: 'enum',
    name: block.name,
    contents: block.values.map((v) => v.name).join('\n'),
  };
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

  modelBlockWriters: PrismaModelBlockWriter[] = [];

  enums: PrismaOutputEnum[] = [];

  addGeneratorBlock(block: PrismaGeneratorBlock): void {
    this.generatorBlocks.push(block);
  }

  setDatasourceBlock(block: PrismaDatasourceBlock): void {
    this.datasourceBlock = block;
  }

  addModelWriter(block: PrismaModelBlockWriter): void {
    if (this.modelBlockWriters.some((b) => b.name === block.name)) {
      throw new Error(`Duplicate model name: ${block.name}`);
    }
    this.modelBlockWriters.push(block);
  }

  addEnum(block: PrismaOutputEnum): void {
    if (this.enums.some((b) => b.name === block.name)) {
      throw new Error(`Duplicate enum name: ${block.name}`);
    }
    this.enums.push(block);
  }

  getModelBlock(name: string): PrismaOutputModel | undefined {
    return this.modelBlockWriters
      .find((block) => block.name === name)
      ?.toOutputModel();
  }

  getEnum(name: string): PrismaOutputEnum | undefined {
    return this.enums.find((block) => block.name === name);
  }

  toText(): string {
    if (!this.datasourceBlock) {
      throw new Error(`Datasource block required`);
    }
    const modelBlocks = this.modelBlockWriters.map((b) => b.toBlock());
    const enumBlocks = this.enums.map((block) => printEnumBlock(block));
    const sortedBlocks = R.sortBy(R.prop('name'), [
      ...modelBlocks,
      ...enumBlocks,
    ]);

    return `${[
      ...this.generatorBlocks.map(formatBlock),
      formatBlock(this.datasourceBlock),
      ...sortedBlocks.map(formatBlock),
    ].join('\n\n')}\n`;
  }
}
