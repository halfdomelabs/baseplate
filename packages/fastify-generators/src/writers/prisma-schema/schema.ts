/* eslint-disable max-classes-per-file */
import indentString from 'indent-string';
import { PrismaOutputModel } from '@src/types/prismaOutput';
import { PrismaModelBlockWriter } from './model-writer';
import {
  PrismaDatasourceBlock,
  PrismaGeneratorBlock,
  PrismaSchemaBlock,
} from './types';

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

  modelBlockWriters: PrismaModelBlockWriter[] = [];

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

  getModelBlock(name: string): PrismaOutputModel | undefined {
    return this.modelBlockWriters
      .find((block) => block.name === name)
      ?.toOutputModel();
  }

  toText(): string {
    if (!this.datasourceBlock) {
      throw new Error(`Datasource block required`);
    }
    return `${[
      ...this.generatorBlocks.map(formatBlock),
      formatBlock(this.datasourceBlock),
      ...this.modelBlockWriters.map((writer) => formatBlock(writer.toBlock())),
    ].join('\n\n')}\n`;
  }
}
