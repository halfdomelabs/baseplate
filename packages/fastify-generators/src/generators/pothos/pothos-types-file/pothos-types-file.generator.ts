import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  mergeFragmentsWithHoistedFragmentsPresorted,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { NamedArrayFieldContainer } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/app-module/index.js';

import {
  pothosImportsProvider,
  pothosSchemaProvider,
} from '../pothos/index.js';

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

interface PothosTypeDefinitionWithOrder {
  /**
   * The name of the type that is being defined.
   */
  name: string;
  /**
   * The order of the type definition.
   */
  order: number;
  /**
   * The fragment of the type definition.
   */
  fragment: TsCodeFragment;
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

            const mergedFragment = mergeFragmentsWithHoistedFragmentsPresorted(
              orderedTypes.map((type) => type.fragment),
              '\n\n',
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
