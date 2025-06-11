import {
  nodeProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import type { ScalarFieldType } from '#src/types/field-types.js';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';

import {
  pothosConfigProvider,
  pothosImportsProvider,
} from '../pothos/pothos.generator.js';
import { POTHOS_POTHOS_SCALAR_TS_TEMPLATES } from './generated/ts-templates.js';

type ScalarTemplateKey = keyof typeof POTHOS_POTHOS_SCALAR_TS_TEMPLATES;

interface PothosScalarConfig {
  name: string;
  scalar: ScalarFieldType;
  templatePath: ScalarTemplateKey;
  path: string;
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
    templatePath: 'dateTime',
    export: 'DateTimeScalar',
    inputType: 'Date',
    outputType: 'Date | string',
    dependencies: {},
    devDependencies: {},
    path: 'date-time.ts',
  },
  date: {
    name: 'Date',
    scalar: 'date',
    templatePath: 'date',
    export: 'DateScalar',
    inputType: 'Date',
    outputType: 'Date | string',
    dependencies: {},
    devDependencies: {},
    path: 'date.ts',
  },
  uuid: {
    name: 'Uuid',
    scalar: 'uuid',
    templatePath: 'uuid',
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
    path: 'uuid.ts',
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
    node: createProviderTask(nodeProvider, (node) => {
      const scalarConfig = scalarConfigMap[type];
      node.packages.addPackages({
        prod: scalarConfig.dependencies,
        dev: scalarConfig.devDependencies,
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        pothosConfig: pothosConfigProvider,
        pothosImports: pothosImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({
        appModule,
        pothosConfig,
        pothosImports,
        errorHandlerServiceImports,
        typescriptFile,
      }) {
        const scalarConfig = scalarConfigMap[type];
        const scalarPath = path.posix.join(
          appModule.getModuleFolder(),
          'scalars',
          scalarConfig.path,
        );

        const { name, scalar, inputType, outputType } = scalarConfig;

        appModule.moduleImports.push(scalarPath);

        pothosConfig.customScalars.set(scalar, {
          name,
          scalar,
          inputType,
          outputType,
        });

        pothosConfig.schemaFiles.push(scalarPath);

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  POTHOS_POTHOS_SCALAR_TS_TEMPLATES[scalarConfig.templatePath],
                destination: scalarPath,
                importMapProviders: {
                  pothosImports,
                  errorHandlerServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
