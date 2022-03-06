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

export interface ServiceOutputDtoScalarField extends ServiceOutputDtoBaseField {
  type: 'scalar';
  scalarType: ScalarFieldType;
}

export interface ServiceOutputDtoNestedField extends ServiceOutputDtoBaseField {
  type: 'nested';
  nestedType: ServiceOutputDto;
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
}

export function scalarPrismaFieldToServiceField(
  field: PrismaOutputScalarField
): ServiceOutputDtoField {
  return {
    type: 'scalar',
    name: field.name,
    isOptional: field.isOptional,
    isNullable: field.isOptional,
    isList: field.isList,
    scalarType: field.scalarType,
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
  model: PrismaOutputModel
): ServiceOutputDto {
  return {
    name: model.name,
    fields: model.fields.map((field) =>
      field.type === 'scalar'
        ? scalarPrismaFieldToServiceField(field)
        : nestedPrismaFieldToServiceField(field)
    ),
  };
}
