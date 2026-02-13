// standard typings of service output

import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ScalarFieldType } from './field-types.js';
import type {
  PrismaOutputModel,
  PrismaOutputRelationField,
  PrismaOutputScalarField,
} from './prisma-output.js';
import type { InferKindMetadata, ServiceDtoKind } from './service-dto-kinds.js';

// TODO: Rename ServiceOutput to Service since it's both inputs and outputs

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
  expression: TsCodeFragment;
}

export interface ServiceOutputDtoScalarField extends ServiceOutputDtoBaseField {
  type: 'scalar';
  scalarType: ScalarFieldType;
  enumType?: ServiceOutputEnum;
  isId?: boolean;
}

export type ServiceOutputDtoNestedField =
  | ServiceOutputDtoNestedFieldWithoutPrisma
  | ServiceOutputDtoNestedFieldWithPrisma;

export interface ServiceOutputDtoNestedFieldWithoutPrisma extends ServiceOutputDtoBaseField {
  type: 'nested';
  isPrismaType?: false;
  nestedType: ServiceOutputDto;
  typescriptType?: TsCodeFragment;
  schemaFieldName?: string;
  /**
   * Fragment that references the Zod schema for the nested field.
   */
  zodSchemaFragment?: TsCodeFragment;
}

export interface ServiceOutputDtoNestedFieldWithPrisma extends ServiceOutputDtoBaseField {
  type: 'nested';
  isPrismaType: true;
  nestedType: Omit<ServiceOutputDto, 'fields'>;
  typescriptType?: TsCodeFragment;
  schemaFieldName?: string;
}

/**
 * Injected arg - a service argument that is provided by the framework
 * at runtime rather than from user input.
 *
 * Examples: context, query, id
 *
 * The kind and metadata are strongly typed based on the TKind parameter.
 *
 * @template TKind - The service DTO kind that defines the type and metadata
 */
export interface ServiceOutputDtoInjectedArg<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TKind extends ServiceDtoKind<any> = ServiceDtoKind<any>,
> extends ServiceOutputDtoBaseField {
  type: 'injected';
  kind: TKind;
  metadata: InferKindMetadata<TKind>;
}

export function createServiceOutputDtoInjectedArg<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TKind extends ServiceDtoKind<any>,
>(
  arg: undefined extends InferKindMetadata<TKind>
    ? Omit<ServiceOutputDtoInjectedArg<TKind>, 'metadata'>
    : ServiceOutputDtoInjectedArg<TKind>,
): ServiceOutputDtoInjectedArg<TKind> {
  return {
    ...arg,
    metadata:
      'metadata' in arg
        ? arg.metadata
        : (undefined as InferKindMetadata<TKind>),
  };
}

export type ServiceOutputDtoField =
  | ServiceOutputDtoScalarField
  | ServiceOutputDtoNestedField;

export type ServiceOutputArgField =
  | ServiceOutputDtoField
  | ServiceOutputDtoInjectedArg;

export interface ServiceOutputDto {
  name: string;
  fields: ServiceOutputDtoField[];
}

export interface ServiceOutputMethod {
  name: string;
  /**
   * Fragment that references the method.
   */
  referenceFragment: TsCodeFragment;
  arguments: ServiceOutputArgField[];
  returnType: ServiceOutputDto;
  requiresContext?: boolean;
}

export function scalarPrismaFieldToServiceOutputField(
  field: PrismaOutputScalarField,
  lookupEnum: (name: string) => ServiceOutputEnum,
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

export function scalarPrismaFieldToServiceInputField(
  field: PrismaOutputScalarField,
  lookupEnum: (name: string) => ServiceOutputEnum,
): ServiceOutputDtoScalarField {
  return {
    type: 'scalar',
    name: field.name,
    isOptional: field.hasDefault || field.isOptional,
    isNullable: field.isOptional,
    isList: field.isList,
    scalarType: field.scalarType,
    enumType:
      field.enumType === undefined ? undefined : lookupEnum(field.enumType),
    isId: field.id,
  };
}

export function nestedPrismaFieldToServiceField(
  field: PrismaOutputRelationField,
): ServiceOutputDtoNestedField {
  return {
    type: 'nested',
    name: field.name,
    isOptional: field.isOptional,
    isNullable: field.isOptional,
    isList: field.isList,
    isPrismaType: true,
    nestedType: {
      name: field.modelType,
    },
  };
}

export function prismaToServiceOutputDto(
  model: PrismaOutputModel,
  lookupEnum: (name: string) => ServiceOutputEnum,
): ServiceOutputDto {
  return {
    name: model.name,
    fields: model.fields.map((field) =>
      field.type === 'scalar'
        ? scalarPrismaFieldToServiceOutputField(field, lookupEnum)
        : nestedPrismaFieldToServiceField(field),
    ),
  };
}
