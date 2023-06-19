import {
  nodeProvider,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { ScalarFieldType } from '@src/types/fieldTypes.js';
import { nexusSetupProvider } from '../nexus/index.js';

interface NexusScalarConfig {
  name: string;
  scalar: ScalarFieldType;
  templatePath: string;
  export: string;
  nexusMethod: string;
  sourceType: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const createNexusScalarMap = <T extends Record<string, NexusScalarConfig>>(
  t: T
): T => t;

const scalarConfigMap = createNexusScalarMap({
  dateTime: {
    name: 'DateTime',
    scalar: 'dateTime',
    templatePath: 'date-time.ts',
    export: 'DateTimeScalar',
    nexusMethod: 'dateTime',
    sourceType: 'Date',
    dependencies: {},
    devDependencies: {},
  },
  date: {
    name: 'Date',
    scalar: 'date',
    templatePath: 'date.ts',
    export: 'DateScalar',
    nexusMethod: 'date',
    sourceType: 'Date',
    dependencies: {},
    devDependencies: {},
  },
  uuid: {
    name: 'Uuid',
    scalar: 'uuid',
    templatePath: 'uuid.ts',
    export: 'UuidScalar',
    nexusMethod: 'uuid',
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

const NexusScalarGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    nexusSetup: nexusSetupProvider,
    node: nodeProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
  },
  createGenerator(
    { type },
    { appModule, nexusSetup, node, errorHandlerService, typescript }
  ) {
    const scalarConfig = scalarConfigMap[type];
    const scalarPath = `${appModule.getModuleFolder()}/scalars/${
      scalarConfig.templatePath
    }`;
    appModule.registerFieldEntry(
      'schemaTypes',
      new TypescriptCodeExpression(
        scalarConfig.export,
        `import {${scalarConfig.export}} from '@/${scalarPath.replace(
          /\.ts$/,
          ''
        )}'`
      )
    );
    const { name, scalar, nexusMethod, sourceType } = scalarConfig;
    nexusSetup.addScalarField({
      name,
      scalar,
      nexusMethod,
      sourceType,
    });
    nexusSetup.registerSchemaFile(scalarPath);

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
            importMappers: [errorHandlerService],
          })
        );
      },
    };
  },
});

export default NexusScalarGenerator;
