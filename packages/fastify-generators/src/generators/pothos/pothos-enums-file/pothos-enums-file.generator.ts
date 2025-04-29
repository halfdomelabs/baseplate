import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { mapValuesOfMap } from '@halfdomelabs/utils';
import { kebabCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import { pothosConfigProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

interface PothosEnum {
  name: string;
  exportName: string;
  fragment: TsCodeFragment;
}

export interface PothosEnumsFileProvider {
  registerEnum(type: PothosEnum): void;
}

export const pothosEnumsFileProvider =
  createProviderType<PothosEnumsFileProvider>('pothos-enums-file');

export const pothosEnumsFileGenerator = createGenerator({
  name: 'pothos/pothos-enums-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ id, name }) => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        pothosConfig: pothosConfigProvider,
      },
      exports: {
        pothosEnumsFile: pothosEnumsFileProvider.export(),
      },
      run({ appModule, typescriptFile, pothosConfig }) {
        const typesPath = path.posix.join(
          appModule.getModuleFolder(),
          'schema',
          `${kebabCase(name)}.ts`,
        );

        appModule.moduleImports.push(typesPath);
        pothosConfig.schemaFiles.push(typesPath);

        const enums = new Map<string, PothosEnum>();

        return {
          providers: {
            pothosEnumsFile: {
              registerEnum(pothosEnum) {
                enums.set(pothosEnum.name, pothosEnum);
                pothosConfig.enums.set(pothosEnum.name, {
                  typeName: pothosEnum.name,
                  exportName: pothosEnum.exportName,
                  moduleName: typesPath,
                });
              },
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id,
                destination: typesPath,
                fragment: TsCodeUtils.mergeFragments(
                  mapValuesOfMap(enums, (pothosEnum) => pothosEnum.fragment),
                  '\n\n',
                ),
              }),
            );
          },
        };
      },
    }),
  }),
});
