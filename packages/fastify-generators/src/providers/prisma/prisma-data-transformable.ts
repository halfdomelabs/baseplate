import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';

export interface PrismaTransform {
  inputFields: ServiceOutputDtoField[];
  transformer: TypescriptCodeExpression;
  outputFields: string[];
}

export interface PrismaDataTransformable {
  addTransform(transform: PrismaTransform): void;
}

export const prismaDataTransformable =
  createProviderType<PrismaDataTransformable>('prisma-data-transformable');
