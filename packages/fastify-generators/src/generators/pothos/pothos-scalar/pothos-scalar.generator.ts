import {
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ScalarFieldType } from '@src/types/field-types.js';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import { pothosSetupProvider } from '../pothos/pothos.generator.js';

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
  t: T,
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
      uuid: FASTIFY_PACKAGES.uuid,
    },
    devDependencies: {
      '@types/uuid': FASTIFY_PACKAGES['@types/uuid'],
    },
  },
});

type ScalarConfigKey = keyof typeof scalarConfigMap;

const descriptorSchema = z.object({
  type: z.enum(
    Object.keys(scalarConfigMap) as [ScalarConfigKey, ...ScalarConfigKey[]],
  ),
});

export const pothosScalarGenerator = createGenerator({
  name: 'pothos/pothos-scalar',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.type,
  buildTasks: ({ type }) => ({
    main: createGeneratorTask({
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
          `${appModule.getModuleFolder()}/scalars/${scalarConfig.templatePath}`,
        );
        appModule.moduleImports.push(scalarImport);

        const { name, scalar, inputType, outputType } = scalarConfig;

        pothosSetup
          .getTypeReferences()
          .addCustomScalar({ name, scalar, inputType, outputType });

        pothosSetup.registerSchemaFile(scalarPath);

        node.packages.addPackages({
          prod: scalarConfig.dependencies,
          dev: scalarConfig.devDependencies,
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: scalarConfig.templatePath,
                destination: scalarPath,
                importMappers: [pothosSetup, errorHandlerService],
              }),
            );
          },
        };
      },
    }),
  }),
});
