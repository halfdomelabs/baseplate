import type { ScalarFieldType } from './field-types.js';

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
  enumType?: string;
}

export interface PrismaOutputRelationField extends PrismaOutputBaseField {
  type: 'relation';
  modelType: string;
  relationName?: string;
  fields?: string[];
  references?: string[];
}

export type PrismaOutputField =
  | PrismaOutputScalarField
  | PrismaOutputRelationField;

export interface PrismaOutputModel {
  name: string;
  fields: PrismaOutputField[];
  idFields: string[] | null;
}

export interface PrismaOutputEnumValue {
  name: string;
}

export interface PrismaOutputEnum {
  name: string;
  values: PrismaOutputEnumValue[];
}
