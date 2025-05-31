import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ServiceOutputDtoField } from '#src/types/service-output.js';

export interface PrismaDataTransformInputField {
  type: TsCodeFragment;
  dtoField: ServiceOutputDtoField;
}

export interface PrismaDataTransformOutputField {
  name: string;
  transformer?: TsCodeFragment;
  pipeOutputName?: string;
  createExpression?: TsCodeFragment | string;
  updateExpression?: TsCodeFragment | string;
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
    transformerOptions: PrismaDataTransformerOptions,
  ) => PrismaDataTransformer;
}
