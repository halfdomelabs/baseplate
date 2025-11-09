import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import { serviceFileProvider } from '#src/generators/core/index.js';
import { getPrimaryKeyDefinition } from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';

import { generateRelationBuildData } from '../_shared/build-data-helpers/index.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  fields: z.array(z.string().min(1)),
});

/**
 * Generator for prisma/prisma-data-update
 */
export const prismaDataUpdateGenerator = createGenerator({
  name: 'prisma/prisma-data-update',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, fields }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
      },
      run({ serviceFile, prismaDataService, dataUtilsImports, prismaOutput }) {
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
            const fieldsFragment =
              fields.length === serviceFields.length
                ? prismaDataService.getFieldsVariableName()
                : tsTemplateWithImports([
                    tsImportBuilder(['pick']).from('es-toolkit'),
                  ])`pick(${prismaDataService.getFieldsVariableName()}, [${fields.map((field) => quot(field)).join(', ')}] as const)`;

            // Generate buildData function that transforms FK fields into relations
            const relationBuildData = generateRelationBuildData({
              prismaModel: prismaOutput.getPrismaModel(modelName),
              inputFieldNames: fields,
              operationType: 'update',
              dataUtilsImports,
            });

            const updateOperation = tsTemplate`
              export const ${name} = ${dataUtilsImports.defineUpdateOperation.fragment()}({
                model: ${quot(lowercaseFirstChar(modelName))},
                fields: ${fieldsFragment},
                buildData: ${relationBuildData.buildDataFunctionFragment},
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
              type: 'update',
              fragment: updateOperation,
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
                      fields: [
                        whereField,
                        {
                          name: 'data',
                          type: 'nested',
                          nestedType: {
                            name: `${uppercaseFirstChar(name)}Data`,
                            fields: usedFields.map(
                              (field) => field.outputDtoField,
                            ),
                          },
                        },
                      ],
                    },
                  },
                ],
                requiresContext: true,
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
