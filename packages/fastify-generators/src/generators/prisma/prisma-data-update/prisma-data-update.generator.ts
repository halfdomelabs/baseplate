import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import { serviceFileProvider } from '#src/generators/core/index.js';
import {
  contextKind,
  prismaQueryKind,
  prismaWhereUniqueInputKind,
} from '#src/types/service-dto-kinds.js';
import {
  createServiceOutputDtoInjectedArg,
  prismaToServiceOutputDto,
} from '#src/types/service-output.js';

import { authorizerUtilsImportsProvider } from '../../auth/_providers/authorizer-utils-imports.js';
import { serviceContextImportsProvider } from '../../core/service-context/generated/ts-import-providers.js';
import { buildTransformOperationParts } from '../_shared/build-data-helpers/build-transform-operation-parts.js';
import { generateAuthorizationStatements } from '../_shared/build-data-helpers/generate-authorization-statements.js';
import { generateWhereType } from '../_shared/build-data-helpers/generate-where-type.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import { prismaModelAuthorizerProvider } from '../prisma-model-authorizer/index.js';
import {
  prismaImportsProvider,
  prismaOutputProvider,
} from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  fields: z.array(z.string().min(1)),
  globalRoles: z.array(z.string().min(1)).optional(),
  instanceRoles: z.array(z.string().min(1)).optional(),
});

/**
 * Generator for prisma/prisma-data-update
 *
 * Generates an update function that:
 * - Loads existing item (always, for authorization and/or transform fields)
 * - Checks authorization (global and/or instance)
 * - For scalar-only models: calls prisma.model.update directly
 * - For models with transformers: uses prepareTransformers + executeTransformPlan
 */
export const prismaDataUpdateGenerator = createGenerator({
  name: 'prisma/prisma-data-update',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, fields, globalRoles, instanceRoles }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaImports: prismaImportsProvider,
        authorizerImports: authorizerUtilsImportsProvider,
        serviceContextImports: serviceContextImportsProvider,
        modelAuthorizer: prismaModelAuthorizerProvider
          .dependency()
          .optionalReference(modelName),
      },
      run({
        serviceFile,
        prismaDataService,
        dataUtilsImports,
        prismaOutput,
        prismaImports,
        authorizerImports,
        serviceContextImports,
        modelAuthorizer,
      }) {
        const serviceFields = prismaDataService.getFields();
        const usedFields = serviceFields.filter((field) =>
          fields.includes(field.name),
        );
        if (usedFields.length !== fields.length) {
          throw new Error(
            `Fields ${fields.filter((field) => !usedFields.some((f) => f.name === field)).join(', ')} not found in service fields`,
          );
        }

        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);
            const prismaModel = prismaOutput.getPrismaModel(modelName);
            const hasTransformFields = prismaDataService.hasTransformFields();
            const transformersVarName =
              prismaDataService.getTransformersVariableName() ?? '';

            // Use shared helper for field categorization, destructure, and data building
            const parts = buildTransformOperationParts({
              fields: usedFields,
              prismaModel,
              dataUtilsImports,
              operationType: 'update',
              transformersVarFragment: transformersVarName,
              existingItemVarName: 'existingItem',
            });

            // Generate authorization
            const { fragment: authFragment, hasInstanceAuth } =
              generateAuthorizationStatements({
                modelName,
                methodType: 'Update',
                globalRoles,
                instanceRoles,
                modelAuthorizer,
                authorizerImports,
              });

            // Determine if we need existingItem:
            // - Instance auth needs it for checkInstanceAuthorization
            // - Transform fields with 'existingField' forUpdate pattern need existingItem.fieldId
            // (loadExisting pattern handles its own fetch, doesn't need top-level existingItem)
            const hasExistingFieldTransform = usedFields.some(
              (f) => f.transformer?.forUpdatePattern?.kind === 'existingField',
            );
            const needsExistingItem =
              hasInstanceAuth || hasExistingFieldTransform;
            const existingItemFragment = needsExistingItem
              ? tsTemplate`const existingItem = await ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where });`
              : '';

            const whereType = generateWhereType(prismaModel);

            // Extract transformer entries (guaranteed defined when hasTransformFields is true)
            const transformersObject =
              parts.transformersObjectFragment ?? tsTemplate`{}`;

            const updateFunction = hasTransformFields
              ? // Transform path: prepareTransformers + executeTransformPlan
                tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data: input,
                  query,
                  context,
                }: {
                  where: ${whereType};
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'UpdateSchema')}>;
                  query?: TQuery;
                  context: ${serviceContextImports.ServiceContext.typeFragment()};
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authFragment}
                  ${parts.inputDestructureFragment}

                  const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
                    transformers: ${transformersObject},
                    serviceContext: context,
                  });

                  const result = await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
                    execute: async ({ tx, transformed }) =>
                      tx.${modelVar}.update({
                        where,
                        data: ${parts.prismaDataFragment},
                      }),
                    refetch: (item) =>
                      ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where: { id: item.id }, ...query }),
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `
              : // Scalar-only path: direct Prisma call
                tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data: input,
                  query,
                  context,
                }: {
                  where: ${whereType};
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'UpdateSchema')}>;
                  query?: TQuery;
                  context: ${serviceContextImports.ServiceContext.typeFragment()};
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authFragment}
                  ${parts.inputDestructureFragment}

                  const result = await ${prismaImports.prisma.fragment()}.${modelVar}.update({
                    where,
                    data: ${parts.prismaDataFragment},
                    ...query,
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;

            const schemaName = `${modelVar}UpdateSchema`;
            const methodFragment = TsCodeUtils.importFragment(
              name,
              serviceFile.getServicePath(),
            );
            const schemaMethodFragment = TsCodeUtils.importFragment(
              schemaName,
              serviceFile.getServicePath(),
            );

            prismaDataService.registerMethod({
              name,
              type: 'update',
              fragment: updateFunction,
              outputMethod: {
                name,
                referenceFragment: methodFragment,
                arguments: [
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'where',
                    kind: prismaWhereUniqueInputKind,
                    metadata: {
                      idFields: prismaModel.idFields ?? [],
                    },
                  }),
                  {
                    name: 'data',
                    type: 'nested',
                    nestedType: {
                      name: `${uppercaseFirstChar(name)}Data`,
                      fields: usedFields.map((field) => ({
                        ...field.outputDtoField,
                        isOptional: true,
                      })),
                    },
                    zodSchemaFragment: schemaMethodFragment,
                  },
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'context',
                    kind: contextKind,
                  }),
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'query',
                    kind: prismaQueryKind,
                  }),
                ],
                returnType: prismaToServiceOutputDto(prismaModel, (enumName) =>
                  prismaOutput.getServiceEnum(enumName),
                ),
              },
            });
          },
        };
      },
    }),
  }),
});
