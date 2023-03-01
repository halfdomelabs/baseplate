import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';

export interface PothosTypeDefinition {
  name: string;
  exportName: string;
  definition: TypescriptCodeBlock;
}

export interface PothosExpressionWithChildren {
  expression: TypescriptCodeExpression;
  childDefinitions?: PothosTypeDefinition[];
}

export interface PothosTypeDefinitionWithChildren extends PothosTypeDefinition {
  childDefinitions?: PothosTypeDefinition[];
}
