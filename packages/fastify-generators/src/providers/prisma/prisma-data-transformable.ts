import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';

export interface PrismaDataTransformInputField {
  type: TypescriptCodeExpression;
  dtoField: ServiceOutputDtoField;
}

export interface PrismaDataTransformOutputField {
  name: string;
  outputVariableName?: string;
}

export interface PrismaDataTransformer {
  inputFields: PrismaDataTransformInputField[];
  outputFields: PrismaDataTransformOutputField[];
  transformer: TypescriptCodeBlock;
}

export interface PrismaDataTransformable {
  getModelName(): string;
  addTransformer(transformer: PrismaDataTransformer): void;
}

export const prismaDataTransformableProvider =
  createProviderType<PrismaDataTransformable>('prisma-data-transformable');
