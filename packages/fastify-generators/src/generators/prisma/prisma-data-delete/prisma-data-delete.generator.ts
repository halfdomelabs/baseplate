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

import { generateDeleteExecuteCallback } from '../_shared/build-data-helpers/index.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
});

/**
 * Generator for prisma/prisma-data-delete
 */
export const prismaDataDeleteGenerator = createGenerator({
  name: 'prisma/prisma-data-delete',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
      },
      run({ serviceFile, prismaDataService, dataUtilsImports, prismaOutput }) {
        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);

            // Generate execute callback
            const { executeCallbackFragment } = generateDeleteExecuteCallback({
              modelVariableName: modelVar,
            });

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
                  execute: ${executeCallbackFragment},
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
