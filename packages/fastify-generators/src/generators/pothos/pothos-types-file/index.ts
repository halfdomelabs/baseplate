import {
  makeImportAndFilePath,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { pothosSchemaProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  fileName: z.string().min(1),
  categoryOrder: z.array(z.string()).optional(),
});

type Config = z.infer<typeof descriptorSchema>;

interface PothosType {
  name?: string;
  block: TypescriptCodeBlock;
  category?: string;
}

export interface PothosTypesFileProvider {
  getBuilder: () => string;
  getModuleName: () => string;
  registerType(type: PothosType): void;
}

export const pothosTypesFileProvider =
  createProviderType<PothosTypesFileProvider>('pothos-types-file');

export const createPothosTypesFileTask = createTaskConfigBuilder(
  ({ fileName, categoryOrder }: Config) => ({
    name: 'pothos-types-file',
    dependencies: {
      appModule: appModuleProvider,
      typescript: typescriptProvider,
      pothosSchema: pothosSchemaProvider,
    },
    exports: {
      pothosTypes: pothosTypesFileProvider,
    },
    run({ appModule, typescript, pothosSchema }) {
      const [typesImport, typesPath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/schema/${fileName}.ts`,
      );

      appModule.addModuleImport(typesImport);
      pothosSchema.registerSchemaFile(typesPath);

      const registeredKeys: string[] = [];

      const types: PothosType[] = [];

      return {
        getProviders: () => ({
          pothosTypes: {
            getBuilder: () => 'builder',
            getModuleName: () => typesImport,
            registerType(type) {
              const { name: typeName } = type;
              if (typeName) {
                if (registeredKeys.includes(typeName)) {
                  return;
                }
                registeredKeys.push(typeName);
              }
              types.push(type);
            },
          },
        }),
        build: async (builder) => {
          const orderedTypes = R.sortBy((type) => {
            if (!type.category || !categoryOrder?.includes(type.category)) {
              return (categoryOrder || []).length;
            }
            return categoryOrder.indexOf(type.category);
          }, types);

          const typesFile = typescript.createTemplate({
            TYPES: TypescriptCodeUtils.mergeBlocks(
              orderedTypes.map((t) => t.block),
              '\n\n',
            ),
          });

          typesFile.addCodeAddition({
            importText: [`import {builder} from '%pothos'`],
            importMappers: [pothosSchema],
          });

          await builder.apply(
            typesFile.renderToActionFromText('TYPES', typesPath),
          );
        },
      };
    },
  }),
);

const PothosTypesFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createPothosTypesFileTask(descriptor));
  },
});

export default PothosTypesFileGenerator;
