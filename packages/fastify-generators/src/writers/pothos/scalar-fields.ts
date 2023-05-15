import {
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { ServiceOutputDtoScalarField } from '@src/types/serviceOutput';
import { upperCaseFirst } from '@src/utils/case';
import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers';
import { PothosWriterOptions } from './options';

export function writePothosInputFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions
): TypescriptCodeExpression {
  const { methodName = 'field', type } = getPothosMethodAndTypeForScalar(
    field,
    options
  );

  const fieldOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type,
  });

  return TypescriptCodeUtils.formatExpression(
    `BUILDER.POTHOS_METHOD(${fieldOptions ? 'OPTIONS' : ''})`,
    {
      BUILDER: options.fieldBuilder,
      POTHOS_METHOD: methodName,
      OPTIONS: fieldOptions || '',
    }
  );
}

export function writePothosObjectFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions
): TypescriptCodeExpression {
  const { methodName = 'field', type } = getPothosMethodAndTypeForScalar(
    field,
    options
  );
  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type,
  });

  return TypescriptCodeUtils.formatExpression(
    `BUILDER.POTHOS_METHOD(${fieldOptions ? 'OPTIONS' : ''})`,
    {
      BUILDER: options.fieldBuilder,
      POTHOS_METHOD: methodName,
      OPTIONS: fieldOptions || '',
    }
  );
}

export function writePothosExposeFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions
): TypescriptCodeExpression {
  const { methodName, type } = getPothosMethodAndTypeForScalar(field, options);
  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type,
  });

  const exposeMethodName = methodName
    ? // exposeID instead of exposeId
      `expose${upperCaseFirst(methodName === 'id' ? 'ID' : methodName)}`
    : 'expose';

  return TypescriptCodeUtils.formatExpression(
    `BUILDER.POTHOS_METHOD(FIELD_NAME${fieldOptions ? ', OPTIONS' : ''})`,
    {
      BUILDER: options.fieldBuilder,
      FIELD_NAME: quot(field.name),
      POTHOS_METHOD: exposeMethodName,
      OPTIONS: fieldOptions || '',
    }
  );
}
