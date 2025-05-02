import type {
  TsCodeFragment,
  TsUtilsImportsProvider,
} from '@halfdomelabs/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@halfdomelabs/core-generators';
import { singularize } from 'inflection';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/service-output.js';

function buildNestedArgExpression(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsImportsProvider,
): TsCodeFragment {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { fields } = arg.nestedType;
  const nestedFields = fields.filter(
    (f): f is ServiceOutputDtoNestedField => f.type === 'nested',
  );

  if (nestedFields.length > 0) {
    // look for all nested expressions with restrictions
    const nestedExpressionsWithRestrict = nestedFields
      .map((nestedField) => ({
        field: nestedField,
        // mutual recursion

        expression: convertNestedArgForCall(
          {
            ...nestedField,
            name: nestedField.isList
              ? singularize(nestedField.name)
              : `${arg.name}.${nestedField.name}`,
          },
          tsUtils,
        ),
      }))
      .filter((f) => f.expression.contents.includes('restrictObjectNulls'));

    if (nestedExpressionsWithRestrict.length > 0) {
      return TsCodeUtils.formatFragment(
        `{
          ...${arg.name},
          RESTRICT_EXPRESSIONS
        }`,
        {
          RESTRICT_EXPRESSIONS: TsCodeUtils.mergeFragmentsPresorted(
            nestedExpressionsWithRestrict.map(({ field, expression }) => {
              if (field.isList) {
                return tsTemplate`${field.name}: ${arg.name}.${
                  field.name
                }?.map((${singularize(field.name)}) => ${
                  expression.contents.trimStart().startsWith('{')
                    ? tsTemplate`(${expression})`
                    : expression
                })`;
              }
              return tsTemplate`${field.name}: ${arg.name}.${field.name} && ${expression}`;
            }),
            ',\n',
          ),
        },
      );
    }
  }
  return tsCodeFragment(arg.name);
}

function convertNestedArgForCall(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsImportsProvider,
): TsCodeFragment {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { fields } = arg.nestedType;
  const nonNullableOptionalFields = fields.filter(
    (f) => f.isOptional && !f.isNullable,
  );

  const nestedArgExpression: TsCodeFragment = buildNestedArgExpression(
    arg,
    tsUtils,
  );

  if (nonNullableOptionalFields.length > 0) {
    return TsCodeUtils.templateWithImports([
      tsUtils.restrictObjectNulls.declaration(),
    ])`restrictObjectNulls(${nestedArgExpression}, [${nonNullableOptionalFields
      .map((f) => `'${f.name}'`)
      .join(', ')}])`;
  }
  return nestedArgExpression;
}

export function writeValueFromPothosArg(
  arg: ServiceOutputDtoField,
  tsUtils: TsUtilsImportsProvider,
): TsCodeFragment {
  // TODO: Handle convert all nulls
  if (arg.isOptional && !arg.isNullable) {
    throw new Error(`Optional non-nullable top-level args not handled`);
  }
  if (arg.type === 'nested') {
    return convertNestedArgForCall(arg, tsUtils);
  }
  return tsCodeFragment(arg.name);
}
