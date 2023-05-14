import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';

export interface PrismaDataTransformInputField {
  type: TypescriptCodeExpression;
  dtoField: ServiceOutputDtoField;
}

export interface PrismaDataTransformOutputField {
  name: string;
  transformer?: TypescriptCodeBlock;
  pipeOutputName?: string;
  createExpression?: TypescriptCodeExpression | string;
  updateExpression?: TypescriptCodeExpression | string;
}

export interface PrismaDataTransformer {
  inputFields: PrismaDataTransformInputField[];
  outputFields: PrismaDataTransformOutputField[];
  isAsync: boolean;
  needsContext?: boolean;
  needsExistingItem?: boolean;
}

export interface PrismaDataTransformerOptions {
  operationType: 'create' | 'update' | 'upsert';
}

export interface PrismaDataTransformerFactory {
  buildTransformer: (
    transformerOptions: PrismaDataTransformerOptions
  ) => PrismaDataTransformer;
}
