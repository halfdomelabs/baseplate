import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import { serviceFileProvider } from '#src/generators/core/index.js';
import { contextKind, prismaQueryKind } from '#src/types/service-dto-kinds.js';
import {
  createServiceOutputDtoInjectedArg,
  prismaToServiceOutputDto,
} from '#src/types/service-output.js';

import { authorizerUtilsImportsProvider } from '../../auth/_providers/authorizer-utils-imports.js';
import { generateAuthorizationStatements } from '../_shared/build-data-helpers/generate-authorization-statements.js';
import { generateRelationBuildData } from '../_shared/build-data-helpers/generate-relation-build-data.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import {
  prismaImportsProvider,
  prismaOutputProvider,
} from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  fields: z.array(z.string().min(1)),
  globalRoles: z.array(z.string().min(1)).optional(),
});

/**
 * Generator for prisma/prisma-data-create
 *
 * Generates a create function that:
 * - Checks authorization (global only for creates)
 * - For scalar-only models: calls prisma.model.create directly
 * - For models with transformers: uses prepareTransformers + executeTransformPlan
 */
export const prismaDataCreateGenerator = createGenerator({
  name: 'prisma/prisma-data-create',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, fields, globalRoles }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaImports: prismaImportsProvider,
        authorizerImports: authorizerUtilsImportsProvider,
      },
      run({
        serviceFile,
        prismaDataService,
        dataUtilsImports,
        prismaOutput,
        prismaImports,
        authorizerImports,
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

            // Generate FK → relation transformations
            const {
              createReturnFragment: fkReturnFragment,
              passthrough: noFkRelations,
              foreignKeyFieldNames,
            } = generateRelationBuildData({
              prismaModel,
              inputFieldNames: scalarFieldNames,
              dataUtilsImports,
              dataName: 'rest',
            });

            // Generate authorization
            const { fragment: authFragment } = generateAuthorizationStatements({
              modelName,
              methodType: 'Create',
              globalRoles,
              modelAuthorizer: undefined,
              authorizerImports,
            });

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

            let createFunction;

            if (hasTransformFields) {
              // Transform path: prepareTransformers + executeTransformPlan
              // Safe: we're inside hasTransformFields check
              const transformersVarName =
                prismaDataService.getTransformersVariableName() ?? '';
              const transformersObject = TsCodeUtils.mergeFragmentsAsObject(
                Object.fromEntries(
                  transformFieldNames.map((fieldName) => [
                    fieldName,
                    tsTemplate`${transformersVarName}.${fieldName}.forCreate(${fieldName})`,
                  ]),
                ),
              );

              createFunction = tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  data: input,
                  query,
                  context,
                }: {
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'CreateSchema')}>;
                  query?: TQuery;
                  context: ServiceContext;
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${authFragment}
                  ${inputDestructure}

                  const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
                    transformers: ${transformersObject},
                    serviceContext: context,
                  });

                  const result = await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
                    execute: async ({ tx, transformed }) =>
                      tx.${modelVar}.create({
                        data: ${prismaDataFragment},
                      }),
                    refetch: (item) =>
                      ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where: { id: item.id }, ...query }),
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;
            } else {
              // Scalar-only path: direct Prisma call, no transaction
              createFunction = tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  data: input,
                  query,
                  context,
                }: {
                  data: z.infer<typeof ${prismaDataService.getFieldSchemasVariableName().replace('FieldSchemas', 'CreateSchema')}>;
                  query?: TQuery;
                  context: ServiceContext;
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${authFragment}
                  ${inputDestructure}

                  const result = await ${prismaImports.prisma.fragment()}.${modelVar}.create({
                    data: ${prismaDataFragment},
                    ...query,
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;
            }

            const schemaName = `${modelVar}CreateSchema`;
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
              type: 'create',
              fragment: createFunction,
              outputMethod: {
                name,
                referenceFragment: methodFragment,
                arguments: [
                  {
                    name: 'data',
                    type: 'nested',
                    nestedType: {
                      name: `${uppercaseFirstChar(name)}Data`,
                      fields: usedFields.map((field) => field.outputDtoField),
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
                returnType: prismaToServiceOutputDto(
                  prismaOutput.getPrismaModel(modelName),
                  (enumName) => prismaOutput.getServiceEnum(enumName),
                ),
              },
            });
          },
        };
      },
    }),
  }),
});
