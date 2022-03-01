// standard typings of service output

import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { ScalarFieldType } from './fieldTypes';
import { PrismaOutputModel, PrismaOutputScalarField } from './prismaOutput';

interface ServiceOutputDtoBaseField {
  name: string;
  type: string;
  isOptional?: boolean;
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

export function prismaToServiceOutputDto(
  model: PrismaOutputModel
): ServiceOutputDto {
  return {
    name: model.name,
    fields: model.fields
      .filter(
        (field): field is PrismaOutputScalarField => field.type === 'scalar'
      )
      .map((field) => ({
        type: 'scalar',
        name: field.name,
        isOptional: field.isOptional,
        isList: field.isList,
        scalarType: field.scalarType,
      })),
  };
}
