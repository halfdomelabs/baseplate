import {
  TsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { singularize } from 'inflection';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/serviceOutput.js';

function buildNestedArgExpression(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsProvider
): TypescriptCodeExpression {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { fields } = arg.nestedType;
  const nestedFields = fields.filter(
    (f): f is ServiceOutputDtoNestedField => f.type === 'nested'
  );

  if (nestedFields.length) {
    // look for all nested expressions with restrictions
    const nestedExpressionsWithRestrict = nestedFields
      .map((nestedField) => ({
        field: nestedField,
        // mutual recursion
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        expression: convertNestedArgForCall(
          {
            ...nestedField,
            name: nestedField.isList
              ? singularize(nestedField.name)
              : `${arg.name}.${nestedField.name}`,
          },
          tsUtils
        ),
      }))
      .filter((f) => f.expression.content.includes('restrictObjectNulls'));

    if (nestedExpressionsWithRestrict.length) {
      return TypescriptCodeUtils.formatExpression(
        `{
          ...${arg.name},
          RESTRICT_EXPRESSIONS
        }`,
        {
          RESTRICT_EXPRESSIONS: TypescriptCodeUtils.mergeExpressions(
            nestedExpressionsWithRestrict.map(({ field, expression }) => {
              if (field.isList) {
                return expression.wrap(
                  (contents) =>
                    `${field.name}: ${arg.name}.${
                      field.name
                    }?.map((${singularize(field.name)}) => ${
                      contents.trimStart().startsWith('{')
                        ? `(${contents})`
                        : contents
                    })`
                );
              }
              return expression.wrap(
                (contents) =>
                  `${field.name}: ${arg.name}.${field.name} && ${contents}`
              );
            }),
            ',\n'
          ),
        }
      );
    }
  }
  return new TypescriptCodeExpression(arg.name);
}

function convertNestedArgForCall(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsProvider
): TypescriptCodeExpression {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { fields } = arg.nestedType;
  const nonNullableOptionalFields = fields.filter(
    (f) => f.isOptional && !f.isNullable
  );

  const nestedArgExpression: TypescriptCodeExpression =
    buildNestedArgExpression(arg, tsUtils);

  if (nonNullableOptionalFields.length) {
    return TypescriptCodeUtils.formatExpression(
      `restrictObjectNulls(ARG, [${nonNullableOptionalFields
        .map((f) => `'${f.name}'`)
        .join(', ')}])`,
      { ARG: nestedArgExpression },
      {
        importText: [`import {restrictObjectNulls} from '%ts-utils/nulls';`],
        importMappers: [tsUtils],
      }
    );
  }
  return nestedArgExpression;
}

export function writeValueFromPothosArg(
  arg: ServiceOutputDtoField,
  tsUtils: TsUtilsProvider
): TypescriptCodeExpression {
  // TODO: Handle convert all nulls
  if (arg.isOptional && !arg.isNullable) {
    throw new Error(`Optional non-nullable top-level args not handled`);
  }
  if (arg.type === 'nested') {
    return convertNestedArgForCall(arg, tsUtils);
  }
  return new TypescriptCodeExpression(arg.name);
}
