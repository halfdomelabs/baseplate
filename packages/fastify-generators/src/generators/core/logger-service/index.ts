import type {
  ImportMapper,
  TsCodeFragment,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptFileTask,
  nodeProvider,
  projectScope,
  TsCodeUtils,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/index.js';
import { loggerFileTemplate } from './generated/templates.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

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
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        fastify: fastifyProvider,
      },
      exports: {
        loggerServiceSetup: loggerServiceSetupProvider.export(projectScope),
        loggerService: loggerServiceProvider.export(projectScope),
      },
      run({ node, fastify }) {
        const mixins = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({}, { name: 'logger-service-mixins' });

        fastify.getConfig().set('devOutputFormatter', 'pino-pretty -t');

        node.addPackages({
          pino: FASTIFY_PACKAGES.pino,
        });

        node.addDevPackages({
          'pino-pretty': FASTIFY_PACKAGES['pino-pretty'],
        });

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
          build: (builder) => {
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

            builder.addDynamicTask(
              createTypescriptFileTask({
                template: loggerFileTemplate,
                variables: {
                  TPL_LOGGER_OPTIONS:
                    Object.keys(loggerOptions).length > 0
                      ? TsCodeUtils.mergeFragmentsAsObject(loggerOptions)
                      : '',
                },
                destination: 'src/services/logger.ts',
                fileId: 'logger',
                options: {
                  alternateFullIds: [
                    '@halfdomelabs/fastify-generators#core/logger-service:src/services/logger.ts',
                  ],
                },
              }),
            );
          },
        };
      },
    }),
  ],
});
