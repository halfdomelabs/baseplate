import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { lowercaseFirstChar, quot, uppercaseFirstChar } from '@baseplate-dev/utils';
import { z } from 'zod';

import { serviceFileProvider } from '#src/generators/core/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';
import { getPrimaryKeyDefinition } from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';

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
            const deleteOperation = tsTemplate`
              export const ${name} = ${dataUtilsImports.defineDeleteOperation.fragment()}({
                model: ${quot(lowercaseFirstChar(modelName))},
              })
            `;
            serviceFile.getServicePath();

            const prismaModel = prismaOutput.getPrismaModel(modelName);
            const idArgument = getPrimaryKeyDefinition(prismaModel);
            const whereField = {
              ...idArgument,
              name: 'where',
            };

            prismaDataService.registerMethod({
              name,
              type: 'delete',
              fragment: deleteOperation,
              outputMethod: {
                name,
                referenceFragment: TsCodeUtils.importFragment(
                  name,
                  serviceFile.getServicePath(),
                ),
                arguments: [
                  {
                    type: 'nested',
                    name: 'input',
                    nestedType: {
                      name: `${uppercaseFirstChar(name)}Input`,
                      fields: [whereField],
                    },
                  },
                ],
                requiresContext: true,
                returnType: prismaToServiceOutputDto(
                  prismaModel,
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

