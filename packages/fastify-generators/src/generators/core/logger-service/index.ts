import {
  createTypescriptTemplateConfig,
  ImportMapper,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
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
  { isReadOnly: true }
);

const loggerServiceFileConfig = createTypescriptTemplateConfig({
  LOGGER_OPTIONS: { type: 'code-expression' },
});

const LoggerServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    fastify: fastifyProvider,
    typescript: typescriptProvider,
  },
  exports: {
    loggerServiceSetup: loggerServiceSetupProvider,
    loggerService: loggerServiceProvider,
  },
  createGenerator(descriptor, { node, fastify, typescript }) {
    const mixins = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({}, { name: 'logger-service-mixins' });

    fastify.getConfig().set('devOutputFormatter', 'pino-pretty -t');

    node.addPackages({
      pino: '8.1.0',
    });

    node.addDevPackages({
      'pino-pretty': '8.1.0',
    });

    const importMap = {
      '%logger-service': {
        path: '@/src/services/logger',
        allowedImports: ['logger'],
      },
    };

    return {
      getProviders: () => ({
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
              'import { logger } from "@/src/services/logger"'
            );
          },
          getImportMap() {
            return importMap;
          },
        },
      }),
      build: async (builder) => {
        const loggerFile = typescript.createTemplate(loggerServiceFileConfig);

        const loggerOptions: Record<string, TypescriptCodeExpression> = {};

        // log level vs. number for better log parsing
        loggerOptions.formatters = TypescriptCodeUtils.createExpression(
          `{
  level(level) {
    return { level };
  },
}`
        );

        if (Object.keys(mixins.value()).length) {
          loggerOptions.mixin = TypescriptCodeUtils.wrapExpression(
            TypescriptCodeUtils.mergeExpressionsAsObject(mixins.value()),
            TypescriptCodeUtils.createWrapper(
              (expression) => `function mixin() {
              return ${expression};
            }`
            )
          );
        }

        loggerFile.addCodeExpression(
          'LOGGER_OPTIONS',
          Object.keys(loggerOptions).length
            ? TypescriptCodeUtils.mergeExpressionsAsObject(loggerOptions)
            : TypescriptCodeUtils.createExpression('')
        );

        await builder.apply(
          loggerFile.renderToAction('logger.ts', 'src/services/logger.ts')
        );
      },
    };
  },
});

export default LoggerServiceGenerator;
