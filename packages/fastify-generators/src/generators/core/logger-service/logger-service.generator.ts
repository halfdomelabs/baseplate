import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/index.js';
import { CORE_LOGGER_SERVICE_GENERATED } from './generated/index.js';

const [
  setupTask,
  loggerServiceConfigProvider,
  loggerServiceConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    mixins: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'logger-service',
    configScope: projectScope,
  },
);

export { loggerServiceConfigProvider };

export const loggerServiceGenerator = createGenerator({
  name: 'core/logger-service',
  generatorFileUrl: import.meta.url,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['pino']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['pino-pretty']),
    }),
    fastify: createProviderTask(fastifyProvider, (fastify) => {
      fastify.devOutputFormatter.set('pino-pretty -t');
    }),
    paths: CORE_LOGGER_SERVICE_GENERATED.paths.task,
    imports: CORE_LOGGER_SERVICE_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        paths: CORE_LOGGER_SERVICE_GENERATED.paths.provider,
        typescriptFile: typescriptFileProvider,
        loggerServiceConfigValues: loggerServiceConfigValuesProvider,
      },
      run({ typescriptFile, loggerServiceConfigValues: { mixins }, paths }) {
        return {
          build: async (builder) => {
            const loggerOptions: Record<string, TsCodeFragment | string> = {};

            // log level vs. number for better log parsing
            loggerOptions.formatters = `{
  level(level) {
    return { level };
  },
}`;

            if (mixins.size > 0) {
              loggerOptions.mixin = TsCodeUtils.template`
                function mixin() {
                  return ${TsCodeUtils.mergeFragmentsAsObject(mixins)};
                }`;
            }

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_LOGGER_SERVICE_GENERATED.templates.logger,
                variables: {
                  TPL_LOGGER_OPTIONS:
                    Object.keys(loggerOptions).length > 0
                      ? TsCodeUtils.mergeFragmentsAsObject(loggerOptions)
                      : '',
                },
                destination: paths.logger,
              }),
            );
          },
        };
      },
    }),
  }),
});
