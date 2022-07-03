import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
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
  isAsync: boolean;
  needsContext?: boolean;
}

export interface PrismaDataTransformerOptions {
  isUpdate: boolean;
}

export interface PrismaDataTransformerFactory {
  buildTransformer: (
    transformerOptions: PrismaDataTransformerOptions
  ) => PrismaDataTransformer;
}
