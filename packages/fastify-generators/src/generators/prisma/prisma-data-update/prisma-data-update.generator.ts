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
import { generateAuthorizationStatements } from '../_shared/build-data-helpers/generate-authorization-statements.js';
import { generateRelationBuildData } from '../_shared/build-data-helpers/generate-relation-build-data.js';
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

            // Determine which fields are scalar (FK or plain) for the destructure
            const scalarFieldNames = usedFields
              .filter((f) => !f.isTransformField)
              .map((f) => f.name);

            const transformFieldNames = usedFields
              .filter((f) => f.isTransformField)
              .map((f) => f.name);

            // Generate FK → relation transformations (for update, use connectUpdate)
            const {
              updateReturnFragment: fkReturnFragment,
              passthrough: noFkRelations,
              foreignKeyFieldNames,
            } = generateRelationBuildData({
              prismaModel,
              inputFieldNames: scalarFieldNames,
              dataUtilsImports,
              dataName: 'rest',
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

            // Determine if we need existingItem (for instance auth or transform fields)
            const needsExistingItem = hasInstanceAuth || hasTransformFields;
            const existingItemFragment = needsExistingItem
              ? tsTemplate`const existingItem = await ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where });`
              : '';

            // Build the destructure pattern
            const allDestructuredNames = [
              ...transformFieldNames,
              ...foreignKeyFieldNames,
            ];
            const hasDestructure = allDestructuredNames.length > 0;

            const inputDestructure = hasDestructure
              ? tsTemplate`const { ${allDestructuredNames.join(', ')}, ...rest } = input;`
              : '';

            const dataName = hasDestructure ? 'rest' : 'input';

            // Build the Prisma data object
            const prismaDataFragment = noFkRelations
              ? hasTransformFields
                ? tsTemplate`{ ...${dataName}, ...transformed }`
                : dataName
              : hasTransformFields
                ? tsTemplate`{ ...${fkReturnFragment}, ...transformed }`
                : fkReturnFragment;

            let updateFunction;

            if (hasTransformFields) {
              // Transform path: prepareTransformers + executeTransformPlan
              const transformersVarName =
                prismaDataService.getTransformersVariableName() ?? '';

              const transformersObject = TsCodeUtils.mergeFragmentsAsObject(
                Object.fromEntries(
                  transformFieldNames.map((fieldName) => [
                    fieldName,
                    // TODO: Generate proper existing value access based on transformer type
                    tsTemplate`${transformersVarName}.${fieldName}.forUpdate(${fieldName}, existingItem.${fieldName}Id)`,
                  ]),
                ),
              );

              updateFunction = tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data: input,
                  query,
                  context,
                }: {
                  where: { id: string };
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'UpdateSchema')}>;
                  query?: TQuery;
                  context: ServiceContext;
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authFragment}
                  ${inputDestructure}

                  const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
                    transformers: ${transformersObject},
                    serviceContext: context,
                  });

                  const result = await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
                    execute: async ({ tx, transformed }) =>
                      tx.${modelVar}.update({
                        where,
                        data: ${prismaDataFragment},
                      }),
                    refetch: (item) =>
                      ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where: { id: item.id }, ...query }),
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;
            } else {
              // Scalar-only path: direct Prisma call
              updateFunction = tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data: input,
                  query,
                  context,
                }: {
                  where: { id: string };
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'UpdateSchema')}>;
                  query?: TQuery;
                  context: ServiceContext;
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authFragment}
                  ${inputDestructure}

                  const result = await ${prismaImports.prisma.fragment()}.${modelVar}.update({
                    where,
                    data: ${prismaDataFragment},
                    ...query,
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;
            }

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
