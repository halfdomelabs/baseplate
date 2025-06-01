import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/fastify-redis.generator.js';
import { fastifyOutputProvider } from '#src/generators/core/fastify/fastify.generator.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/logger-service.generator.js';

import {
  bullMqImportsProvider,
  createBullMqImports,
} from './generated/ts-import-maps.js';
import { BULL_BULL_MQ_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const bullMqGenerator = createGenerator({
  name: 'bull/bull-mq',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['bullmq']),
    }),
    nodeScripts: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }) {
        const devOutputFormatter = fastifyOutput.getDevOutputFormatter();
        const devWorkersCommand = [
          'tsx watch --clear-screen=false',
          ...fastifyOutput.getNodeFlagsDev(),
          './scripts/run-workers.ts',
          devOutputFormatter ? `| ${devOutputFormatter}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        node.scripts.mergeObj({
          'dev:workers': devWorkersCommand,
          'run:workers': 'pnpm run:script ./scripts/run-workers.ts',
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
        fastifyRedisImports: fastifyRedisImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        bullMqImports: bullMqImportsProvider.export(projectScope),
      },
      run({
        errorHandlerServiceImports,
        loggerServiceImports,
        fastifyRedisImports,
        typescriptFile,
      }) {
        const bullServiceBase = '@/src/services/bull';
        return {
          providers: {
            bullMqImports: createBullMqImports(bullServiceBase),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: BULL_BULL_MQ_TS_TEMPLATES.scriptsGroup,
                baseDirectory: '@/scripts',
                importMapProviders: {
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
                variables: {
                  scriptsRunWorkers: {
                    TPL_WORKERS: tsCodeFragment('[]'),
                  },
                  scriptsSynchronizeRepeatJobs: {
                    TPL_REPEAT_JOBS: tsCodeFragment('[]'),
                  },
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: BULL_BULL_MQ_TS_TEMPLATES.serviceGroup,
                baseDirectory: bullServiceBase,
                importMapProviders: {
                  fastifyRedisImports,
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
