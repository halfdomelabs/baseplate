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

import {
  generateAuthorizeFragment,
  generateDeleteExecuteCallback,
} from '../_shared/build-data-helpers/index.js';
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
        modelAuthorizer,
      }) {
        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);

            // Generate execute callback
            const { executeCallbackFragment } = generateDeleteExecuteCallback({
              modelVariableName: modelVar,
            });

            // Build authorize array from global + instance roles
            const authorizeFragment = generateAuthorizeFragment({
              modelName,
              methodType: 'Delete',
              globalRoles,
              instanceRoles,
              modelAuthorizer,
            });

            // Instance roles require loadExisting to fetch the model instance
            const hasInstanceRoles =
              instanceRoles != null && instanceRoles.length > 0;
            const loadExistingFragment = hasInstanceRoles
              ? tsTemplate`
                  loadExisting: () => ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where }),`
              : '';

            // Generate the delete function
            const deleteFunction = tsTemplate`
              export async function ${name}<
                TQueryArgs extends ${dataUtilsImports.ModelQuery.typeFragment()}<${quot(modelVar)}> = ${dataUtilsImports.ModelQuery.typeFragment()}<${quot(modelVar)}>,
              >({
                where,
                query,
                context,
              }: ${dataUtilsImports.DataDeleteInput.typeFragment()}<${quot(modelVar)}, TQueryArgs>): Promise<
                ${dataUtilsImports.GetPayload.typeFragment()}<${quot(modelVar)}, TQueryArgs>
              > {
                return ${dataUtilsImports.commitDelete.fragment()}({
                  model: ${quot(modelVar)},
                  query,
                  context,
                  execute: ${executeCallbackFragment},${authorizeFragment}${loadExistingFragment}
                });
              }
            `;

            const prismaModel = prismaOutput.getPrismaModel(modelName);

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
