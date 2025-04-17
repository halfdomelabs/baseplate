import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { prismaOutputProvider } from '@src/generators/prisma/prisma/prisma.generator.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import { pothosEnumsFileProvider } from '../pothos-enums-file/pothos-enums-file.generator.js';

const descriptorSchema = z.object({
  enumName: z.string().min(1),
});

export const pothosPrismaEnumGenerator = createGenerator({
  name: 'pothos/pothos-prisma-enum',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.enumName,
  buildTasks: ({ enumName }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosEnumsFile: pothosEnumsFileProvider,
      },
      run({ prismaOutput, pothosEnumsFile }) {
        const enumBlock = prismaOutput.getServiceEnum(enumName);
        const exportName = `${lowerCaseFirst(enumName)}Enum`;

        const pothosBlock = TypescriptCodeUtils.formatBlock(
          `export const ENUM_TYPE_EXPORT = BUILDER.enumType(ENUM_NAME, ENUM_OPTIONS);`,
          {
            ENUM_TYPE_EXPORT: exportName,
            BUILDER: pothosEnumsFile.getBuilder(),
            ENUM_NAME: quot(enumName),
            ENUM_OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject({
              values: TypescriptCodeUtils.mergeExpressionsAsObject(
                Object.fromEntries(
                  enumBlock.values.map((value) => [value.name, '{}']),
                ),
              ),
            }),
          },
        );

        pothosEnumsFile.registerEnum({
          name: enumName,
          exportName,
          block: pothosBlock,
        });

        return {};
      },
    }),
  }),
});
