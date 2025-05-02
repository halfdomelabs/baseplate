import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  mergeFragmentsWithColocatedDependencies,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { NamedArrayFieldContainer } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import type { PothosTypeDefinition } from '@src/writers/pothos/definitions.js';

import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import {
  pothosImportsProvider,
  pothosSchemaProvider,
} from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  /**
   * The id of the types file - should be unique within the app.
   */
  id: z.string().min(1),
  /**
   * The file name of the types file.
   */
  fileName: z.string().min(1),
});

interface PothosTypeDefinitionWithOrder extends PothosTypeDefinition {
  order: number;
}

export interface PothosTypesFileProvider {
  getBuilderFragment: () => TsCodeFragment;
  getModuleSpecifier: () => string;
  typeDefinitions: Omit<
    NamedArrayFieldContainer<PothosTypeDefinitionWithOrder>,
    'getValue'
  >;
}

export const pothosTypesFileProvider =
  createProviderType<PothosTypesFileProvider>('pothos-types-file');

export const pothosTypesFileGenerator = createGenerator({
  name: 'pothos/pothos-types-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.fileName,
  buildTasks: ({ id, fileName }) => ({
    pothosTypesFile: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        pothosSchema: pothosSchemaProvider,
        pothosImports: pothosImportsProvider,
      },
      exports: {
        pothosTypes: pothosTypesFileProvider.export(),
      },
      run({ appModule, typescriptFile, pothosSchema, pothosImports }) {
        const typesPath = `${appModule.getModuleFolder()}/schema/${fileName}.ts`;

        appModule.moduleImports.push(typesPath);
        pothosSchema.registerSchemaFile(typesPath);

        const typesContainer =
          new NamedArrayFieldContainer<PothosTypeDefinitionWithOrder>();

        return {
          providers: {
            pothosTypes: {
              getBuilderFragment: () => pothosImports.builder.fragment(),
              getModuleSpecifier: () => typesPath,
              typeDefinitions: typesContainer,
            },
          },
          build: async (builder) => {
            const types = typesContainer.getValue();
            const orderedTypes = sortBy(types, [(type) => type.order]);

            const mergedFragment = mergeFragmentsWithColocatedDependencies(
              orderedTypes,
              '\n\n',
              { preserveOrder: true },
            );

            return builder.apply(
              typescriptFile.renderTemplateFragment({
                fragment: mergedFragment,
                id,
                destination: typesPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
