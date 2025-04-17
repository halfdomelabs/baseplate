import type {
  ImportMapper,
  TsCodeFragment,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  TsCodeUtils,
  TypescriptCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/fastify.generator.js';
import {
  createLoggerServiceImports,
  loggerServiceImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_LOGGER_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

export interface LoggerServiceSetupProvider extends ImportMapper {
  addMixin(key: string, expression: TsCodeFragment): void;
}

export const loggerServiceSetupProvider =
  createProviderType<LoggerServiceSetupProvider>('logger-service-setup');

export interface LoggerServiceProvider extends ImportMapper {
  /**
   * Exports expression of singleton loggerService with standard methods:
   *  - .debug
   *  - .info
   *  - .error
   *  - .log
   *  - .warn
   */
  getLogger(): TypescriptCodeExpression;
}

export const loggerServiceProvider = createProviderType<LoggerServiceProvider>(
  'logger-service',
  { isReadOnly: true },
);

export const loggerServiceGenerator = createGenerator({
  name: 'core/logger-service',
  generatorFileUrl: import.meta.url,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['pino']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['pino-pretty']),
    }),
    main: createGeneratorTask({
      dependencies: {
        fastify: fastifyProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        loggerServiceSetup: loggerServiceSetupProvider.export(projectScope),
        loggerService: loggerServiceProvider.export(projectScope),
      },
      outputs: {
        loggerServiceImports: loggerServiceImportsProvider.export(projectScope),
      },
      run({ fastify, typescriptFile }) {
        const mixins = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({}, { name: 'logger-service-mixins' });

        fastify.getConfig().set('devOutputFormatter', 'pino-pretty -t');

        const importMap = {
          '%logger-service': {
            path: '@/src/services/logger.js',
            allowedImports: ['logger'],
          },
        };

        return {
          providers: {
            loggerServiceSetup: {
              addMixin(key, expression) {
                mixins.merge({ [key]: expression });
              },
              getImportMap: () => importMap,
            },
            loggerService: {
              getLogger() {
                return TypescriptCodeUtils.createExpression(
                  'logger',
                  'import { logger } from "@/src/services/logger.js"',
                );
              },
              getImportMap() {
                return importMap;
              },
            },
          },
          build: async (builder) => {
            const loggerOptions: Record<string, TsCodeFragment | string> = {};

            // log level vs. number for better log parsing
            loggerOptions.formatters = `{
  level(level) {
    return { level };
  },
}`;

            if (Object.keys(mixins.value()).length > 0) {
              loggerOptions.mixin = TsCodeUtils.template`
                function mixin() {
                  return ${TsCodeUtils.mergeFragmentsAsObject(mixins.value())};
                }`;
            }

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_LOGGER_SERVICE_TS_TEMPLATES.logger,
                id: 'logger',
                variables: {
                  TPL_LOGGER_OPTIONS:
                    Object.keys(loggerOptions).length > 0
                      ? TsCodeUtils.mergeFragmentsAsObject(loggerOptions)
                      : '',
                },
                destination: 'src/services/logger.ts',
                importMapProviders: {},
                writeOptions: {
                  alternateFullIds: [
                    '@halfdomelabs/fastify-generators#core/logger-service:src/services/logger.ts',
                  ],
                },
              }),
            );

            return {
              loggerServiceImports:
                createLoggerServiceImports('@/src/services'),
            };
          },
        };
      },
    }),
  }),
});

export { loggerServiceImportsProvider } from './generated/ts-import-maps.js';
