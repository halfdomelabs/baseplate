import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { mapValuesOfMap, quot } from '@baseplate-dev/utils';
import { kebabCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/app-module/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import {
  pothosConfigProvider,
  pothosImportsProvider,
} from '../pothos/index.js';

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
  registerEnum(type: PothosEnum): TsCodeFragment;
  /**
   * Registers a Prisma-compatible filter input type (e.g. `StatusFilter`)
   * for an enum previously registered with `registerEnum`, rendered
   * alongside it in the same file. `enumExportName` must be the bare
   * identifier the enum was exported as (not an imported reference) since
   * the filter is rendered into the same module as the enum.
   */
  registerEnumFilter(enumName: string, enumExportName: string): void;
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
        pothosImports: pothosImportsProvider,
      },
      exports: {
        pothosEnumsFile: pothosEnumsFileProvider.export(),
      },
      run({ appModule, typescriptFile, pothosConfig, pothosImports }) {
        const typesPath = path.posix.join(
          appModule.getModuleFolder(),
          'schema',
          `${kebabCase(name)}.ts`,
        );

        appModule.moduleImports.push(typesPath);
        pothosConfig.schemaFiles.push(typesPath);

        const enums = new Map<string, PothosEnum>();
        const enumFilters = new Map<string, TsCodeFragment>();

        return {
          providers: {
            pothosEnumsFile: {
              registerEnum(pothosEnum) {
                enums.set(pothosEnum.name, pothosEnum);
                const reference = createPothosTypeReference({
                  name: pothosEnum.name,
                  exportName: pothosEnum.exportName,
                  moduleSpecifier: typesPath,
                });
                pothosConfig.enums.set(pothosEnum.name, reference);
                return reference.fragment;
              },
              registerEnumFilter(enumName, enumExportName) {
                const filterName = `${enumName}Filter`;
                const variableName = lowerCaseFirst(filterName);

                enumFilters.set(
                  filterName,
                  TsCodeUtils.formatFragment(
                    `export const VARIABLE_NAME = BUILDER.inputType(FILTER_NAME, {
                      fields: (t) => ({
                        equals: t.field({ type: ENUM_NAME }),
                        not: t.field({ type: ENUM_NAME }),
                        in: t.field({ type: [ENUM_NAME] }),
                        notIn: t.field({ type: [ENUM_NAME] }),
                      }),
                    });`,
                    {
                      VARIABLE_NAME: variableName,
                      BUILDER: pothosImports.builder.fragment(),
                      FILTER_NAME: quot(filterName),
                      ENUM_NAME: enumExportName,
                    },
                  ),
                );

                pothosConfig.inputTypes.set(
                  filterName,
                  createPothosTypeReference({
                    name: filterName,
                    exportName: variableName,
                    moduleSpecifier: typesPath,
                  }),
                );
              },
            },
          },
          build: async (builder) => {
            const allFragments = new Map<string, TsCodeFragment>([
              ...mapValuesOfMap(enums, (pothosEnum) => pothosEnum.fragment),
              ...enumFilters,
            ]);

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id,
                destination: typesPath,
                fragment: TsCodeUtils.mergeFragments(allFragments, '\n\n'),
              }),
            );
          },
        };
      },
    }),
  }),
});
