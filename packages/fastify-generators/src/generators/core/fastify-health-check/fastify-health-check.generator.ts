import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { CORE_FASTIFY_HEALTH_CHECK_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [
  setupTask,
  fastifyHealthCheckConfigProvider,
  fastifyHealthCheckConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    healthChecks: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'fastify-health-check',
    configScope: projectScope,
  },
);

export { fastifyHealthCheckConfigProvider };

export const fastifyHealthCheckGenerator = createGenerator({
  name: 'core/fastify-health-check',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    paths: CORE_FASTIFY_HEALTH_CHECK_GENERATED.paths.task,
    fastifyServerConfig: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        paths: CORE_FASTIFY_HEALTH_CHECK_GENERATED.paths.provider,
      },
      run({ fastifyServerConfig, paths }) {
        fastifyServerConfig.plugins.set('healthCheckPlugin', {
          plugin: tsCodeFragment(
            'healthCheckPlugin',
            tsImportBuilder(['healthCheckPlugin']).from(paths.healthCheck),
          ),
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfigValues: fastifyHealthCheckConfigValuesProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_FASTIFY_HEALTH_CHECK_GENERATED.paths.provider,
      },
      run({
        fastifyHealthCheckConfigValues: { healthChecks },
        typescriptFile,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_FASTIFY_HEALTH_CHECK_GENERATED.templates.healthCheck,
                destination: paths.healthCheck,
                variables: {
                  TPL_HEALTH_CHECKS:
                    healthChecks.size > 0
                      ? TsCodeUtils.template`
                    async () => {
                    ${TsCodeUtils.mergeFragments(healthChecks, '\n\n')}
                    return { success: true };
                }`
                      : `async () => ({ success: true })`,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
