import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptTemplateConfig,
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { fastifyProvider } from '../fastify/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface LoggerServiceSetupProvider extends ImportMapper {
  addMixin(key: string, expression: TypescriptCodeExpression): void;
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

const loggerServiceFileConfig = createTypescriptTemplateConfig({
  LOGGER_OPTIONS: { type: 'code-expression' },
});

export const loggerServiceGenerator = createGenerator({
  name: 'core/logger-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        fastify: fastifyProvider,
        typescript: typescriptProvider,
      },
      exports: {
        loggerServiceSetup: loggerServiceSetupProvider.export(projectScope),
        loggerService: loggerServiceProvider.export(projectScope),
      },
      run({ node, fastify, typescript }) {
        const mixins = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression>
        >({}, { name: 'logger-service-mixins' });

        fastify.getConfig().set('devOutputFormatter', 'pino-pretty -t');

        node.addPackages({
          pino: '9.5.0',
        });

        node.addDevPackages({
          'pino-pretty': '13.0.0',
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
          build: async (builder) => {
            const loggerFile = typescript.createTemplate(
              loggerServiceFileConfig,
            );

            const loggerOptions: Record<string, TypescriptCodeExpression> = {};

            // log level vs. number for better log parsing
            loggerOptions.formatters = TypescriptCodeUtils.createExpression(
              `{
  level(level) {
    return { level };
  },
}`,
            );

            if (Object.keys(mixins.value()).length > 0) {
              loggerOptions.mixin = TypescriptCodeUtils.wrapExpression(
                TypescriptCodeUtils.mergeExpressionsAsObject(mixins.value()),
                TypescriptCodeUtils.createWrapper(
                  (expression) => `function mixin() {
              return ${expression};
            }`,
                ),
              );
            }

            loggerFile.addCodeExpression(
              'LOGGER_OPTIONS',
              Object.keys(loggerOptions).length > 0
                ? TypescriptCodeUtils.mergeExpressionsAsObject(loggerOptions)
                : TypescriptCodeUtils.createExpression(''),
            );

            await builder.apply(
              loggerFile.renderToAction('logger.ts', 'src/services/logger.ts'),
            );
          },
        };
      },
    });
  },
});
