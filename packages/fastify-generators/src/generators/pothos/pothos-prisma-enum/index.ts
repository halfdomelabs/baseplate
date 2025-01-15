import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createTaskConfigBuilder } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import { pothosEnumsFileProvider } from '../pothos-enums-file/index.js';

const descriptorSchema = z.object({
  enumName: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(({ enumName }: Descriptor) => ({
  name: 'main',
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
}));

export const pothosPrismaEnumGenerator = createGenerator({
  name: 'pothos/pothos-prisma-enum',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
