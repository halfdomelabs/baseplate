import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';

import { nexusTypesFileProvider } from '../nexus-types-file/index.js';

const descriptorSchema = z.object({
  enumName: z.string().min(1),
});

const ENUM_TYPE_TEMPLATE = `
export const ENUM_TYPE_EXPORT = enumType(ENUM_OPTIONS);
`.trim();

const NexusPrismaEnumGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypesFile: nexusTypesFileProvider,
  },
  createGenerator({ enumName }, { prismaOutput, nexusTypesFile }) {
    const enumBlock = prismaOutput.getServiceEnum(enumName);

    const nexusBlock = TypescriptCodeUtils.formatBlock(
      ENUM_TYPE_TEMPLATE,
      {
        ENUM_TYPE_EXPORT: `${enumName}Enum`,
        ENUM_OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject({
          name: quot(enumName),
          members: TypescriptCodeUtils.mergeExpressionsAsArray(
            enumBlock.values.map((value) =>
              TypescriptCodeUtils.mergeExpressionsAsObject({
                name: quot(value.name),
              }),
            ),
          ),
        }),
      },
      { importText: ['import {enumType} from "nexus"'] },
    );

    nexusTypesFile.registerType({ block: nexusBlock });

    return {};
  },
});

export default NexusPrismaEnumGenerator;
