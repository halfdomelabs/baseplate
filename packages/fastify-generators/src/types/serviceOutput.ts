// standard typings of service output

import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { ScalarFieldType } from './fieldTypes';
import {
  PrismaOutputModel,
  PrismaOutputRelationField,
  PrismaOutputScalarField,
} from './prismaOutput';

interface ServiceOutputDtoBaseField {
  name: string;
  type: string;
  isOptional?: boolean;
  isNullable?: boolean;
  isList?: boolean;
}

export interface ServiceOutputEnumValue {
  name: string;
}

export interface ServiceOutputEnum {
  name: string;
  values: ServiceOutputEnumValue[];
  expression: TypescriptCodeExpression;
}

export interface ServiceOutputDtoScalarField extends ServiceOutputDtoBaseField {
  type: 'scalar';
  scalarType: ScalarFieldType;
  enumType?: ServiceOutputEnum;
  isId?: boolean;
}

export interface ServiceOutputDtoNestedField extends ServiceOutputDtoBaseField {
  type: 'nested';
  nestedType: ServiceOutputDto;
  typescriptType?: TypescriptCodeExpression;
  schemaFieldName?: string;
}

export type ServiceOutputDtoField =
  | ServiceOutputDtoScalarField
  | ServiceOutputDtoNestedField;

export interface ServiceOutputDto {
  name: string;
  fields: ServiceOutputDtoField[];
}

export interface ServiceOutputMethod {
  name: string;
  expression: TypescriptCodeExpression;
  arguments: ServiceOutputDtoField[];
  returnType: ServiceOutputDto;
  requiresContext?: boolean;
}

export function scalarPrismaFieldToServiceField(
  field: PrismaOutputScalarField,
  lookupEnum: (name: string) => ServiceOutputEnum
): ServiceOutputDtoField {
  if (field.scalarType === 'enum' && !field.enumType) {
    throw new Error(`Enum field must have enum type.`);
  }
  return {
    type: 'scalar',
    name: field.name,
    isOptional: field.isOptional,
    isNullable: field.isOptional,
    isList: field.isList,
    scalarType: field.scalarType,
    enumType:
      field.enumType === undefined ? undefined : lookupEnum(field.enumType),
    isId: field.id,
  };
}

export function nestedPrismaFieldToServiceField(
  field: PrismaOutputRelationField
): ServiceOutputDtoNestedField {
  return {
    type: 'nested',
    name: field.name,
    isOptional: field.isOptional,
    isNullable: field.isOptional,
    isList: field.isList,
    nestedType: {
      name: field.modelType,
      fields: [], // TODO IMPORTANT: Fix this - we need to re-do the typings here
    },
  };
}

export function prismaToServiceOutputDto(
  model: PrismaOutputModel,
  lookupEnum: (name: string) => ServiceOutputEnum
): ServiceOutputDto {
  return {
    name: model.name,
    fields: model.fields.map((field) =>
      field.type === 'scalar'
        ? scalarPrismaFieldToServiceField(field, lookupEnum)
        : nestedPrismaFieldToServiceField(field)
    ),
  };
}
