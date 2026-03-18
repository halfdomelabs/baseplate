import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { lowercaseFirstChar, quot } from '@baseplate-dev/utils';
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
  globalRoles: z.array(z.string().min(1)).optional(),
  instanceRoles: z.array(z.string().min(1)).optional(),
});

/**
 * Generator for prisma/prisma-data-delete
 *
 * Generates a delete function that:
 * - Checks authorization (global and/or instance)
 * - Calls prisma.model.delete directly (no transaction wrapper)
 * - Returns the deleted record
 */
export const prismaDataDeleteGenerator = createGenerator({
  name: 'prisma/prisma-data-delete',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, globalRoles, instanceRoles }) => ({
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
        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);
            const prismaModel = prismaOutput.getPrismaModel(modelName);

            // Generate authorization statements
            const { fragment: authFragment, hasInstanceAuth } =
              generateAuthorizationStatements({
                modelName,
                methodType: 'Delete',
                globalRoles,
                instanceRoles,
                modelAuthorizer,
                authorizerImports,
              });

            // Fetch existing item if needed for instance auth
            const existingItemFragment = hasInstanceAuth
              ? tsTemplate`const existingItem = await ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where });`
              : '';

            const whereType = generateWhereType(prismaModel);

            // Generate the delete function
            const deleteFunction = tsTemplate`
              export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                where,
                query,
                context,
              }: {
                where: ${whereType};
                query?: TQuery;
                context: ${serviceContextImports.ServiceContext.typeFragment()};
              }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                ${existingItemFragment}
                ${authFragment}

                const result = await ${prismaImports.prisma.fragment()}.${modelVar}.delete({
                  where,
                  ...query,
                });

                return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
              }
            `;

            prismaDataService.registerMethod({
              name,
              type: 'delete',
              fragment: deleteFunction,
              outputMethod: {
                name,
                referenceFragment: TsCodeUtils.importFragment(
                  name,
                  serviceFile.getServicePath(),
                ),
                arguments: [
                  createServiceOutputDtoInjectedArg({
                    name: 'where',
                    type: 'injected',
                    kind: prismaWhereUniqueInputKind,
                    metadata: {
                      idFields: prismaModel.idFields ?? [],
                    },
                  }),
                  createServiceOutputDtoInjectedArg({
                    name: 'context',
                    type: 'injected',
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
