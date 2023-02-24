import {
  makeImportAndFilePath,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import R from 'ramda';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module';
import { pothosSetupProvider } from '../pothos';

const descriptorSchema = z.object({
  name: z.string().min(1),
});

type Config = z.infer<typeof descriptorSchema>;

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

export const createPothosEnumsFileTask = createTaskConfigBuilder(
  ({ name }: Config) => ({
    name: 'main',
    dependencies: {
      appModule: appModuleProvider,
      typescript: typescriptProvider,
      pothosSetup: pothosSetupProvider,
    },
    exports: {
      pothosEnumsFile: pothosEnumsFileProvider,
    },
    run({ appModule, typescript, pothosSetup }) {
      const [typesImport, typesPath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/schema/${paramCase(name)}.ts`
      );

      appModule.addModuleImport(typesImport);
      pothosSetup.registerSchemaFile(typesPath);

      const enums: PothosEnum[] = [];

      return {
        getProviders: () => ({
          pothosEnumsFile: {
            getBuilder: () => 'builder',
            registerEnum(pothosEnum) {
              enums.push(pothosEnum);
              pothosSetup.getConfig().append('pothosEnums', {
                name: pothosEnum.name,
                expression: TypescriptCodeUtils.createExpression(
                  pothosEnum.exportName,
                  `import { ${pothosEnum.exportName} } from '${typesImport}`
                ),
              });
            },
          },
        }),
        build: async (builder) => {
          const orderedTypes = R.sortBy((type) => type.name, enums);

          const enumsFile = typescript.createTemplate({
            TYPES: TypescriptCodeUtils.mergeBlocks(
              orderedTypes.map((t) => t.block),
              '\n\n'
            ),
          });

          enumsFile.addCodeAddition({
            importText: [`import {builder} from '%pothos'`],
            importMappers: [pothosSetup],
          });

          await builder.apply(
            enumsFile.renderToActionFromText('TYPES', typesPath)
          );
        },
      };
    },
  })
);

const PothosEnumsFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createPothosEnumsFileTask(descriptor));
  },
});

export default PothosEnumsFileGenerator;
