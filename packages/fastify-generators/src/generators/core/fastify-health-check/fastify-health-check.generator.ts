import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
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
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { z } from 'zod';

import { appRuntimeImportsProvider } from '../app-runtime/index.js';
import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { CORE_FASTIFY_HEALTH_CHECK_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export interface FastifyHealthCheck {
  /** The check expression, e.g. `await prisma.$queryRaw...`. */
  check: TsCodeFragment;
  /**
   * Whether this check reads `services` (e.g. redis reads `services.redis`).
   * A map entry rather than a sibling scalar - several slices may each
   * register a check that needs `services`, so the "does anything need it"
   * signal has to OR across contributors instead of being set once.
   */
  usesServices?: boolean;
}

const [
  setupTask,
  fastifyHealthCheckConfigProvider,
  fastifyHealthCheckConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    healthChecks: t.map<string, FastifyHealthCheck>(),
  }),
  {
    prefix: 'fastify-health-check',
    configScope: packageScope,
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
        fastifyHealthCheckConfigValues: fastifyHealthCheckConfigValuesProvider,
        fastifyServerConfig: fastifyServerConfigProvider,
        paths: CORE_FASTIFY_HEALTH_CHECK_GENERATED.paths.provider,
      },
      run({
        fastifyHealthCheckConfigValues: { healthChecks },
        fastifyServerConfig,
        paths,
      }) {
        const usesServices = [...healthChecks.values()].some(
          (healthCheck) => healthCheck.usesServices,
        );
        fastifyServerConfig.plugins.set('healthCheckPlugin', {
          plugin: tsCodeFragment(
            'healthCheckPlugin',
            tsImportBuilder(['healthCheckPlugin']).from(paths.healthCheck),
          ),
          options: usesServices ? tsCodeFragment('{ services }') : undefined,
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfigValues: fastifyHealthCheckConfigValuesProvider,
        typescriptFile: typescriptFileProvider,
        appRuntimeImports: appRuntimeImportsProvider,
        paths: CORE_FASTIFY_HEALTH_CHECK_GENERATED.paths.provider,
      },
      run({
        fastifyHealthCheckConfigValues: { healthChecks },
        typescriptFile,
        appRuntimeImports,
        paths,
      }) {
        const usesServices = [...healthChecks.values()].some(
          (healthCheck) => healthCheck.usesServices,
        );
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
                    ${TsCodeUtils.mergeFragments(
                      mapValuesOfMap(healthChecks, (h) => h.check),
                      '\n\n',
                    )}
                    return { success: true };
                }`
                      : `async () => ({ success: true })`,
                  // Optional only when unused - the plugin registration then
                  // supplies no `services` at all, whereas a used `services`
                  // must stay required so reading `services.x` in a check
                  // doesn't need to guard against `undefined`.
                  TPL_SERVICES_FIELD: usesServices ? 'services' : 'services?',
                  TPL_PLUGIN_PARAMS: usesServices ? '{ services }' : '_options',
                },
                importMapProviders: {
                  appRuntimeImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
