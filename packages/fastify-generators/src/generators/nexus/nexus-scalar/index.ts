import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { nexusSetupProvider } from '../nexus';

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
  uuid: {
    name: 'Uuid',
    scalar: 'uuid',
    templatePath: 'uuid.ts',
    export: 'UuidScalar',
    nexusMethod: 'uuid',
    sourceType: 'string',
    dependencies: {
      uuid: '^8.3.2',
    },
    devDependencies: {
      '@types/uuid': '^8.3.4',
    },
  },
});

type ScalarConfigKey = keyof typeof scalarConfigMap;

const descriptorSchema = yup.object({
  type: yup
    .mixed<ScalarConfigKey>()
    .oneOf(Object.keys(scalarConfigMap) as ScalarConfigKey[])
    .required(),
});

const NexusScalarGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    nexusSetup: nexusSetupProvider,
    node: nodeProvider,
  },
  createGenerator({ type }, { appModule, nexusSetup, node }) {
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
      node.addPackages(scalarConfig.devDependencies);
    }

    return {
      build: async (builder) => {
        await builder.apply(
          copyTypescriptFileAction({
            source: scalarConfig.templatePath,
            destination: scalarPath,
          })
        );
      },
    };
  },
});

export default NexusScalarGenerator;
