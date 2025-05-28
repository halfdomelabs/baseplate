import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/fastify.generator.js';
import {
  createLoggerServiceImports,
  loggerServiceImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_LOGGER_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

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
    imports: createGeneratorTask({
      exports: {
        loggerServiceImports: loggerServiceImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            loggerServiceImports: createLoggerServiceImports('@/src/services'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        loggerServiceConfigValues: loggerServiceConfigValuesProvider,
      },
      run({ typescriptFile, loggerServiceConfigValues: { mixins } }) {
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
                template: CORE_LOGGER_SERVICE_TS_TEMPLATES.logger,
                variables: {
                  TPL_LOGGER_OPTIONS:
                    Object.keys(loggerOptions).length > 0
                      ? TsCodeUtils.mergeFragmentsAsObject(loggerOptions)
                      : '',
                },
                destination: 'src/services/logger.ts',
              }),
            );
          },
        };
      },
    }),
  }),
});

export { loggerServiceImportsProvider } from './generated/ts-import-maps.js';
