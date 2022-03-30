import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';

interface PrismaDataTransformInput {
  type: TypescriptCodeExpression;
  dtoField: ServiceOutputDtoField;
}

interface PrismaDataTransformOutput {
  name: string;
}

export interface PrismaDataTransformer {
  inputFields: PrismaDataTransformInput[];
  outputFields: PrismaDataTransformOutput[];
  transformer: TypescriptCodeBlock;
}

export interface PrismaDataTransformable {
  addTransformer(transformer: PrismaDataTransformer): void;
}

export const prismaDataTransformableProvider =
  createProviderType<PrismaDataTransformable>('prisma-data-transformable');
