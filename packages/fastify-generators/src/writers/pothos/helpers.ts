import {
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { ServiceOutputDtoScalarField } from '@src/types/serviceOutput';
import {
  getExpressionFromPothosTypeReference,
  PothosWriterOptions,
} from './options';

interface PothosFieldOptions {
  required?: boolean;
  nullable?: boolean;
  type?: TypescriptCodeExpression;
}

export function writePothosFieldOptions(
  fieldOptions: PothosFieldOptions
): TypescriptCodeExpression | undefined {
  const formattedFieldOptions = {
    required: fieldOptions.required ? 'true' : undefined,
    nullable: fieldOptions.nullable ? 'true' : undefined,
    type: fieldOptions.type,
  };

  const hasFieldOptions = Object.values(formattedFieldOptions).some(
    (a) => a !== undefined
  );

  return hasFieldOptions
    ? TypescriptCodeUtils.mergeExpressionsAsObject(formattedFieldOptions)
    : undefined;
}

export function wrapPothosTypeWithList(
  expression: TypescriptCodeExpression,
  isList?: boolean
): TypescriptCodeExpression {
  return isList ? expression.wrap((contents) => `[${contents}]`) : expression;
}

export function getPothosMethodAndTypeForScalar(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions
): {
  methodName?: string | undefined;
  type?: TypescriptCodeExpression | undefined;
} {
  const { pothosMethod, name: scalarName } = options.typeReferences.getScalar(
    field.scalarType
  );

  // prefer use of .id instead of .uuid for IDs
  const pothosMethodWithId =
    field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
      ? 'id'
      : pothosMethod;

  // ex: t.field('enum', { type: MyCoolEnum })
  if (field.scalarType === 'enum') {
    if (!field.enumType) {
      throw new Error(`All enum types must have enumType specified!`);
    }
    return {
      type: wrapPothosTypeWithList(
        getExpressionFromPothosTypeReference(
          options.typeReferences.getEnum(field.enumType.name)
        ),
        field.isList
      ),
    };
  }

  // ex: t.id()
  if (pothosMethodWithId) {
    const pothosMethodWithList = `${pothosMethodWithId}${
      field.isList ? 'List' : ''
    }`;
    return {
      methodName: pothosMethodWithList,
    };
  }

  // ex: t.field({type: "Uuid"});
  return {
    type: wrapPothosTypeWithList(
      new TypescriptCodeExpression(quot(scalarName))
    ),
  };
}
