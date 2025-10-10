import {
  nodeProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ScalarFieldType } from '#src/types/field-types.js';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleProvider } from '#src/generators/core/app-module/index.js';

import {
  pothosConfigProvider,
  pothosImportsProvider,
} from '../pothos/index.js';
import { POTHOS_POTHOS_SCALAR_GENERATED } from './generated/index.js';

type ScalarTemplateKey = keyof typeof POTHOS_POTHOS_SCALAR_GENERATED.templates;

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
    dependencies: {
      'graphql-scalars': FASTIFY_PACKAGES['graphql-scalars'],
    },
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
    dependencies: {
      'graphql-scalars': FASTIFY_PACKAGES['graphql-scalars'],
    },
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
    dependencies: {
      'graphql-scalars': FASTIFY_PACKAGES['graphql-scalars'],
    },
    devDependencies: {},
    path: 'uuid.ts',
  },
  json: {
    name: 'JSON',
    scalar: 'json',
    templatePath: 'json',
    export: 'JSONScalar',
    inputType: 'unknown',
    outputType: 'unknown',
    dependencies: {
      'graphql-scalars': FASTIFY_PACKAGES['graphql-scalars'],
    },
    devDependencies: {},
    path: 'json.ts',
  },
  jsonObject: {
    name: 'JSONObject',
    scalar: 'jsonObject',
    templatePath: 'jsonObject',
    export: 'JSONObjectScalar',
    inputType: 'Record<string, unknown>',
    outputType: 'Record<string, unknown>',
    dependencies: {
      'graphql-scalars': FASTIFY_PACKAGES['graphql-scalars'],
    },
    devDependencies: {},
    path: 'json-object.ts',
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
    paths: POTHOS_POTHOS_SCALAR_GENERATED.paths.task,
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
        paths: POTHOS_POTHOS_SCALAR_GENERATED.paths.provider,
        pothosConfig: pothosConfigProvider,
        pothosImports: pothosImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ appModule, paths, pothosConfig, pothosImports, typescriptFile }) {
        const scalarConfig = scalarConfigMap[type];
        const scalarPath = paths[scalarConfig.templatePath];

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
                  POTHOS_POTHOS_SCALAR_GENERATED.templates[
                    scalarConfig.templatePath
                  ],
                destination: scalarPath,
                importMapProviders: {
                  pothosImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
