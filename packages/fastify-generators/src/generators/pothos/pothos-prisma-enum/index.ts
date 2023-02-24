import { quot, TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { pothosEnumsFileProvider } from '../pothos-enums-file';

const descriptorSchema = z.object({
  enumName: z.string().min(1),
});

const ENUM_TYPE_TEMPLATE = `
export const ENUM_TYPE_EXPORT = BUILDER.enumType(ENUM_NAME, ENUM_OPTIONS);
`.trim();

const PothosPrismaEnumGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    pothosEnumsFile: pothosEnumsFileProvider,
  },
  createGenerator({ enumName }, { prismaOutput, pothosEnumsFile }) {
    const enumBlock = prismaOutput.getServiceEnum(enumName);
    const exportName = `${enumName}Enum`;

    const pothosBlock = TypescriptCodeUtils.formatBlock(ENUM_TYPE_TEMPLATE, {
      BUILDER: pothosEnumsFile.getBuilder(),
      ENUM_TYPE_EXPORT: exportName,
      ENUM_NAME: quot(enumName),
      ENUM_OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject({
        values: TypescriptCodeUtils.mergeExpressionsAsObject(
          Object.fromEntries(
            enumBlock.values.map((value) => [value.name, '{}'])
          )
        ),
      }),
    });

    pothosEnumsFile.registerEnum({
      name: enumName,
      exportName,
      block: pothosBlock,
    });

    return {
      build: async () => {},
    };
  },
});

export default PothosPrismaEnumGenerator;
