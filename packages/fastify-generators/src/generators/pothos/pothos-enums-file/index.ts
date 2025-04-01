import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { kebabCase } from 'change-case';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { pothosSetupProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
});

interface PothosEnum {
  name: string;
  exportName: string;
  block: TypescriptCodeBlock;
}

export interface PothosEnumsFileProvider {
  getBuilder: () => string;
  registerEnum(type: PothosEnum): void;
}

export const pothosEnumsFileProvider =
  createProviderType<PothosEnumsFileProvider>('pothos-enums-file');

export const pothosEnumsFileGenerator = createGenerator({
  name: 'pothos/pothos-enums-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { name }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
        typescript: typescriptProvider,
        pothosSetup: pothosSetupProvider,
      },
      exports: {
        pothosEnumsFile: pothosEnumsFileProvider.export(),
      },
      run({ appModule, typescript, pothosSetup }) {
        const [typesImport, typesPath] = makeImportAndFilePath(
          `${appModule.getModuleFolder()}/schema/${kebabCase(name)}.ts`,
        );

        appModule.addModuleImport(typesImport);
        pothosSetup.registerSchemaFile(typesPath);

        const enums: PothosEnum[] = [];

        return {
          providers: {
            pothosEnumsFile: {
              getBuilder: () => 'builder',
              registerEnum(pothosEnum) {
                enums.push(pothosEnum);
                pothosSetup.getTypeReferences().addPothosEnum({
                  typeName: pothosEnum.name,
                  exportName: pothosEnum.exportName,
                  moduleName: typesImport,
                });
              },
            },
          },
          build: async (builder) => {
            const orderedTypes = sortBy(enums, [(type) => type.name]);

            const enumsFile = typescript.createTemplate({
              TYPES: TypescriptCodeUtils.mergeBlocks(
                orderedTypes.map((t) => t.block),
                '\n\n',
              ),
            });

            enumsFile.addCodeAddition({
              importText: [`import {builder} from '%pothos'`],
              importMappers: [pothosSetup],
            });

            await builder.apply(
              enumsFile.renderToActionFromText('TYPES', typesPath),
            );
          },
        };
      },
    });
  },
});
