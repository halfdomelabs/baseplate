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
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { CORE_FASTIFY_HEALTH_CHECK_TS_TEMPLATES } from './generated/ts-templates.js';

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

const healthCheckPluginPath = '@/src/plugins/health-check.ts';

export const fastifyHealthCheckGenerator = createGenerator({
  name: 'core/fastify-health-check',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    fastifyServerConfig: createProviderTask(
      fastifyServerConfigProvider,
      (fastifyServerConfig) => {
        fastifyServerConfig.plugins.set('healthCheckPlugin', {
          plugin: tsCodeFragment(
            'healthCheckPlugin',
            tsImportBuilder(['healthCheckPlugin']).from(healthCheckPluginPath),
          ),
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfigValues: fastifyHealthCheckConfigValuesProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({
        fastifyHealthCheckConfigValues: { healthChecks },
        typescriptFile,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_HEALTH_CHECK_TS_TEMPLATES.healthCheck,
                destination: healthCheckPluginPath,
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
