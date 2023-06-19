import {
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { ServiceOutputDtoScalarField } from '@src/types/serviceOutput.js';
import { upperCaseFirst } from '@src/utils/case.js';
import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';
import { PothosWriterOptions } from './options.js';

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
