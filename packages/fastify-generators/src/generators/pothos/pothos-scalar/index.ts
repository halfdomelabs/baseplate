import {
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { pothosSetupProvider } from '../pothos';

interface PothosScalarConfig {
  name: string;
  scalar: ScalarFieldType;
  templatePath: string;
  export: string;
  inputType: string;
  outputType: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const createPothosScalarMap = <T extends Record<string, PothosScalarConfig>>(
  t: T
): T => t;

const scalarConfigMap = createPothosScalarMap({
  dateTime: {
    name: 'DateTime',
    scalar: 'dateTime',
    templatePath: 'date-time.ts',
    export: 'DateTimeScalar',
    inputType: 'Date',
    outputType: 'Date | string',
    dependencies: {},
    devDependencies: {},
  },
  date: {
    name: 'Date',
    scalar: 'date',
    templatePath: 'date.ts',
    export: 'DateScalar',
    inputType: 'Date',
    outputType: 'Date | string',
    dependencies: {},
    devDependencies: {},
  },
  uuid: {
    name: 'Uuid',
    scalar: 'uuid',
    templatePath: 'uuid.ts',
    export: 'UuidScalar',
    inputType: 'string',
    outputType: 'string',
    sourceType: 'string',
    dependencies: {
      uuid: '9.0.0',
    },
    devDependencies: {
      '@types/uuid': '9.0.1',
    },
  },
});

type ScalarConfigKey = keyof typeof scalarConfigMap;

const descriptorSchema = z.object({
  type: z.enum(
    Object.keys(scalarConfigMap) as [ScalarConfigKey, ...ScalarConfigKey[]]
  ),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(({ type }: Descriptor) => ({
  name: 'main',
  dependencies: {
    appModule: appModuleProvider,
    pothosSetup: pothosSetupProvider,
    node: nodeProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
  },
  run({ appModule, pothosSetup, node, errorHandlerService, typescript }) {
    const scalarConfig = scalarConfigMap[type];
    const [scalarImport, scalarPath] = makeImportAndFilePath(
      `${appModule.getModuleFolder()}/scalars/${scalarConfig.templatePath}`
    );
    appModule.addModuleImport(scalarImport);

    const { name, scalar, inputType, outputType } = scalarConfig;

    pothosSetup
      .getTypeReferences()
      .addCustomScalar({ name, scalar, inputType, outputType });

    pothosSetup.registerSchemaFile(scalarPath);

    if (scalarConfig.dependencies) {
      node.addPackages(scalarConfig.dependencies);
    }

    if (scalarConfig.devDependencies) {
      node.addDevPackages(scalarConfig.devDependencies);
    }

    return {
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: scalarConfig.templatePath,
            destination: scalarPath,
            importMappers: [pothosSetup, errorHandlerService],
          })
        );
      },
    };
  },
}));

const PothosScalarGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosScalarGenerator;
