import { quot, TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { lowerCaseFirst } from '@src/utils/case';
import { pothosEnumsFileProvider } from '../pothos-enums-file';

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
              enumBlock.values.map((value) => [value.name, '{}'])
            )
          ),
        }),
      }
    );

    pothosEnumsFile.registerEnum({
      name: enumName,
      exportName,
      block: pothosBlock,
    });

    return {
      build: async () => {},
    };
  },
}));

const PothosPrismaEnumGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaEnumGenerator;
