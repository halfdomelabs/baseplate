import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';

import { pothosEnumsFileProvider } from '../pothos-enums-file/index.js';
import { pothosImportsProvider } from '../pothos/index.js';

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
        pothosImports: pothosImportsProvider,
      },
      run({ prismaOutput, pothosEnumsFile, pothosImports }) {
        const enumBlock = prismaOutput.getServiceEnum(enumName);
        const exportName = `${lowerCaseFirst(enumName)}Enum`;

        const enumFragment = tsTemplate`
          export const ${exportName} = ${pothosImports.builder.fragment()}.enumType(${quot(enumName)}, {
            values: ${TsCodeUtils.mergeFragmentsAsObject(
              Object.fromEntries(
                enumBlock.values.map((value) => [value.name, '{}']),
              ),
              // use sort from prisma output
              { disableSort: true },
            )}
          })
        `;

        pothosEnumsFile.registerEnum({
          name: enumName,
          exportName,
          fragment: enumFragment,
        });

        return {};
      },
    }),
  }),
});
