import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/index.js';
import { fastifyOutputProvider } from '#src/generators/core/fastify/index.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/index.js';

import { BULL_BULL_MQ_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const bullMqGenerator = createGenerator({
  name: 'bull/bull-mq',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: BULL_BULL_MQ_GENERATED.paths.task,
    imports: BULL_BULL_MQ_GENERATED.imports.task,
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
        paths: BULL_BULL_MQ_GENERATED.paths.provider,
      },
      run({
        errorHandlerServiceImports,
        loggerServiceImports,
        fastifyRedisImports,
        typescriptFile,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: BULL_BULL_MQ_GENERATED.templates.scriptsGroup,
                paths,
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
              typescriptFile.renderTemplateGroupV2({
                group: BULL_BULL_MQ_GENERATED.templates.serviceGroup,
                paths,
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
