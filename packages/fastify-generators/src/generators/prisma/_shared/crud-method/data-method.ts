import type {
  TsCodeFragment,
  TsHoistedFragment,
} from '@halfdomelabs/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
  tsTypeImportBuilder,
} from '@halfdomelabs/core-generators';
import { notEmpty, safeMergeAllWithOptions } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';

import type { ServiceContextImportsProvider } from '@src/generators/core/service-context/service-context.generator.js';
import type {
  PrismaDataTransformer,
  PrismaDataTransformOutputField,
} from '@src/providers/prisma/prisma-data-transformable.js';
import type { PrismaOutputRelationField } from '@src/types/prisma-output.js';
import type { ServiceOutputDto } from '@src/types/service-output.js';

import { upperCaseFirst } from '@src/utils/case.js';

import type { PrismaUtilsImportsProvider } from '../../prisma-utils/prisma-utils.generator.js';
import type { PrismaOutputProvider } from '../../prisma/prisma.generator.js';

export interface PrismaDataMethodOptions {
  name: string;
  modelName: string;
  prismaFieldNames: string[];
  prismaOutput: PrismaOutputProvider;
  operationName: 'create' | 'update';
  operationType: 'create' | 'upsert' | 'update';
  whereUniqueExpression: string | null;
  // optionally check parent ID matches existing item
  parentIdCheckField?: string;
  isPartial: boolean;
  transformers: PrismaDataTransformer[];
  serviceContextImports: ServiceContextImportsProvider;
  prismaUtils: PrismaUtilsImportsProvider;
}

export function getDataMethodContextRequired({
  transformers,
}: Pick<PrismaDataMethodOptions, 'transformers'>): boolean {
  return transformers.some((t) => t.needsContext);
}

export function wrapWithApplyDataPipe(
  operation: TsCodeFragment,
  pipeNames: string[],
  prismaUtils: PrismaUtilsImportsProvider,
): TsCodeFragment {
  if (pipeNames.length === 0) {
    return operation;
  }
  return TsCodeUtils.templateWithImports(
    prismaUtils.applyDataPipeOutput.declaration(),
  )`applyDataPipeOutput([${pipeNames.join(', ')}], ${operation})`;
}

export function getDataMethodDataType({
  modelName,
  prismaFieldNames,
  prismaOutput,
  operationName,
  isPartial,
  transformers,
}: Omit<PrismaDataMethodOptions, 'name'>): ServiceOutputDto {
  const prismaDefinition = prismaOutput.getPrismaModel(modelName);
  const prismaFields = prismaFieldNames.map((fieldName) => {
    const field = prismaDefinition.fields.find((f) => f.name === fieldName);
    if (!field) {
      throw new Error(
        `Could not find field ${fieldName} in model ${modelName}`,
      );
    }
    return field;
  });
  const transformerFields = transformers.flatMap((transformer) =>
    transformer.inputFields.map((f) => f.dtoField),
  );
  return {
    name: `${modelName}${upperCaseFirst(operationName)}Data`,
    fields: [
      ...prismaFields.map((field) => {
        if (field.type !== 'scalar') {
          throw new Error(
            `Non-scalar fields not suppported in data method operation`,
          );
        }
        return {
          type: 'scalar' as const,
          name: field.name,
          isList: field.isList,
          scalarType: field.scalarType,
          enumType: field.enumType
            ? prismaOutput.getServiceEnum(field.enumType)
            : undefined,
          ...(isPartial
            ? { isOptional: true, isNullable: field.isOptional }
            : {
                isOptional: field.isOptional || field.hasDefault,
                isNullable: field.isOptional,
              }),
        };
      }),
      ...transformerFields,
    ],
  };
}

export function getDataInputTypeBlock(
  dataInputTypeName: string,
  {
    modelName,
    prismaFieldNames,
    operationName,
    transformers,
  }: Omit<PrismaDataMethodOptions, 'name'>,
): TsHoistedFragment {
  const prismaFieldSelection = prismaFieldNames
    .map((field) => `'${field}'`)
    .join(' | ');

  const transformerInputs = transformers.flatMap(
    (transformer) => transformer.inputFields,
  );

  let prismaDataInput = tsCodeFragment(
    `Prisma.${modelName}UncheckedCreateInput`,
    tsTypeImportBuilder(['Prisma']).from('@prisma/client'),
  );
  prismaDataInput =
    operationName === 'create'
      ? prismaDataInput
      : tsTemplate`Partial<${prismaDataInput}>`;

  if (transformerInputs.length === 0) {
    return tsHoistedFragment(
      dataInputTypeName,
      tsTemplate`type ${dataInputTypeName} = Pick<${prismaDataInput}, ${prismaFieldSelection}>;`,
    );
  }

  const customFields = safeMergeAllWithOptions(
    transformers.flatMap((transformer) =>
      transformer.inputFields.map((f) => ({
        [`${f.dtoField.name}${f.dtoField.isOptional ? '?' : ''}`]: f.type,
      })),
    ),
  );

  return tsHoistedFragment(
    dataInputTypeName,
    tsTemplate`
  interface ${dataInputTypeName} extends Pick<${prismaDataInput}, ${prismaFieldSelection}> {
    ${TsCodeUtils.mergeFragmentsAsInterfaceContent(customFields)}
  }`,
  );
}

export function getDataMethodDataExpressions({
  transformers,
  operationType,
  whereUniqueExpression,
  parentIdCheckField,
  prismaOutput,
  modelName,
  prismaFieldNames,
  prismaUtils,
}: Pick<
  PrismaDataMethodOptions,
  | 'prismaOutput'
  | 'modelName'
  | 'transformers'
  | 'operationType'
  | 'whereUniqueExpression'
  | 'parentIdCheckField'
  | 'prismaFieldNames'
  | 'prismaUtils'
>): {
  functionBody: TsCodeFragment | string;
  createExpression: TsCodeFragment;
  updateExpression: TsCodeFragment;
  dataPipeNames: string[];
} {
  if (transformers.length === 0) {
    return {
      functionBody: '',
      createExpression: tsCodeFragment('data'),
      updateExpression: tsCodeFragment('data'),
      dataPipeNames: [],
    };
  }

  // if there are transformers, try to use the CheckedDataInput instead of Unchecked to allow nested creations
  const outputModel = prismaOutput.getPrismaModel(modelName);
  const relationFields = outputModel.fields.filter(
    (field): field is PrismaOutputRelationField =>
      field.type === 'relation' &&
      !!field.fields &&
      field.fields.some((relationScalarField) =>
        prismaFieldNames.includes(relationScalarField),
      ),
  );

  const relationTransformers = relationFields.map(
    (field): PrismaDataTransformer => {
      const relationScalarFields = field.fields ?? [];
      const missingFields = relationScalarFields.filter(
        (f) => !prismaFieldNames.includes(f),
      );
      if (missingFields.length > 0) {
        throw new Error(
          `Relation named ${
            field.name
          } requires all fields as inputs (missing ${missingFields.join(
            ', ',
          )})`,
        );
      }

      // create pseudo-transformer for relation fields
      const transformerPrefix =
        operationType === 'update' || field.isOptional
          ? `${relationScalarFields
              .map((f) => `${f} == null`)
              .join(' || ')} ? ${
              operationType === 'create'
                ? 'undefined'
                : relationScalarFields.join(' && ')
            } : `
          : '';

      const foreignModel = prismaOutput.getPrismaModel(field.modelType);
      const foreignIdFields = foreignModel.idFields;

      if (!foreignIdFields?.length) {
        throw new Error(`Foreign model has to have primary key`);
      }

      const uniqueWhereValue = TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(
          foreignIdFields.map((idField): [string, string] => {
            const idx = field.references?.findIndex(
              (refName) => refName === idField,
            );
            if (idx == null || idx === -1) {
              throw new Error(
                `Relation ${field.name} must have a reference to the primary key of ${field.modelType}`,
              );
            }
            const localField = relationScalarFields[idx];
            return [idField, localField];
          }),
        ),
      );

      const uniqueWhere =
        foreignIdFields.length > 1
          ? tsTemplate`{ ${foreignIdFields.join('_')}: ${uniqueWhereValue}}`
          : uniqueWhereValue;

      const transformer = tsTemplate`const ${field.name} = ${transformerPrefix} { connect: ${uniqueWhere} }`;

      return {
        inputFields: relationScalarFields.map((f) => ({
          type: tsCodeFragment(''),
          dtoField: { name: f, type: 'scalar', scalarType: 'string' },
        })),
        outputFields: [
          {
            name: field.name,
            transformer,
            createExpression:
              operationType === 'upsert'
                ? `${field.name} || undefined`
                : undefined,
            updateExpression: field.isOptional
              ? tsCodeFragment(
                  `createPrismaDisconnectOrConnectData(${field.name})`,
                  prismaUtils.createPrismaDisconnectOrConnectData.declaration(),
                )
              : undefined,
          },
        ],
        isAsync: false,
      };
    },
  );

  const augmentedTransformers = [...transformers, ...relationTransformers];

  const customInputs = augmentedTransformers.flatMap((t) =>
    t.inputFields.map((f) => f.dtoField.name),
  );

  const needsExistingItem =
    operationType !== 'create' &&
    augmentedTransformers.some((t) => t.needsExistingItem);

  const existingItemGetter = needsExistingItem
    ? TsCodeUtils.formatFragment(
        `
const existingItem = OPTIONAL_WHERE
(await PRISMA_MODEL.findUniqueOrThrow({ where: WHERE_UNIQUE }))
`,
        {
          OPTIONAL_WHERE:
            // TODO: Make it a bit more flexible
            operationType === 'upsert' && whereUniqueExpression
              ? `${whereUniqueExpression} && `
              : '',
          PRISMA_MODEL: prismaOutput.getPrismaModelFragment(modelName),
          WHERE_UNIQUE: whereUniqueExpression ?? '',
        },
      )
    : tsCodeFragment('');

  const parentIdCheck =
    parentIdCheckField &&
    `
    if (existingItem && existingItem.${parentIdCheckField} !== parentId) {
      throw new Error('${modelName} not attached to the correct parent item');
    }
    `;

  const functionBody = TsCodeUtils.formatFragment(
    `const { CUSTOM_INPUTS, ...rest } = data;

    EXISTING_ITEM_GETTER

    PARENT_ID_CHECK
     
TRANSFORMERS`,
    {
      CUSTOM_INPUTS: customInputs.join(', '),
      EXISTING_ITEM_GETTER: existingItemGetter,
      PARENT_ID_CHECK: parentIdCheck ?? '',
      TRANSFORMERS: TsCodeUtils.mergeFragments(
        new Map(
          augmentedTransformers
            .flatMap((t) =>
              t.outputFields.map(
                (f): [string, TsCodeFragment] | undefined =>
                  f.transformer && [f.name, f.transformer],
              ),
            )
            .filter(notEmpty),
        ),
        '\n\n',
      ),
    },
  );

  function createExpressionEntries(
    expressionExtractor: (
      field: PrismaDataTransformOutputField,
    ) => TsCodeFragment | string | undefined,
  ): TsCodeFragment {
    const dataExpressionEntries = [
      ...sortBy(
        augmentedTransformers.flatMap((t) =>
          t.outputFields.map((f): [string, TsCodeFragment | string] => [
            f.name,
            expressionExtractor(f) ??
              (f.pipeOutputName ? `${f.pipeOutputName}.data` : f.name),
          ]),
        ),
        [([name]) => name],
      ),
      ['...', 'rest'] as [string, string],
    ];

    return TsCodeUtils.mergeFragmentsAsObject(
      Object.fromEntries(dataExpressionEntries),
      { disableSort: true },
    );
  }

  const createExpression = createExpressionEntries((f) => f.createExpression);

  const updateExpression = createExpressionEntries((f) => f.updateExpression);

  return {
    functionBody,
    createExpression,
    updateExpression,
    dataPipeNames: transformers.flatMap((t) =>
      t.outputFields.map((f) => f.pipeOutputName).filter(notEmpty),
    ),
  };
}
