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
 * Generator for prisma/prisma-data-create
 */
export const prismaDataCreateGenerator = createGenerator({
  name: 'prisma/prisma-data-create',
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
              operationType: 'create',
              dataUtilsImports,
            });

            const createOperation = tsTemplate`
              export const ${name} = ${dataUtilsImports.defineCreateOperation.fragment()}({
                model: ${quot(lowercaseFirstChar(modelName))},
                fields: ${fieldsFragment},
                buildData: ${relationBuildData.buildDataFunctionFragment},
              })
            `;
            serviceFile.getServicePath();

            prismaDataService.registerMethod({
              name,
              type: 'create',
              fragment: createOperation,
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
