import { ScalarFieldType } from './fieldTypes';

// A standardized Prisma model for use in other generators
interface PrismaOutputBaseField {
  name: string;
  id: boolean;
  type: string;
  isOptional: boolean;
  isList: boolean;
  hasDefault: boolean;
}

export interface PrismaOutputScalarField extends PrismaOutputBaseField {
  type: 'scalar';
  scalarType: ScalarFieldType;
}

export interface PrismaOutputRelationField extends PrismaOutputBaseField {
  type: 'relation';
  modelType: string;
}

export type PrismaOutputField =
  | PrismaOutputScalarField
  | PrismaOutputRelationField;

export interface PrismaOutputModel {
  name: string;
  fields: PrismaOutputField[];
}
