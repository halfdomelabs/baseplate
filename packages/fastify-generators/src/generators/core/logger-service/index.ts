import {
  createTypescriptTemplateConfig,
  ImportMapper,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyProvider } from '../fastify';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface LoggerServiceProvider extends ImportMapper {
  addMixin(key: string, expression: TypescriptCodeExpression): void;
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

export const loggerServiceProvider =
  createProviderType<LoggerServiceProvider>('logger-service');

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

    return {
      getProviders: () => ({
        loggerService: {
          addMixin(key, expression) {
            mixins.merge({ [key]: expression });
          },
          getLogger() {
            return TypescriptCodeUtils.createExpression(
              'logger',
              'import { logger } from "@/src/services/logger"'
            );
          },
          getImportMap() {
            return {
              '%logger-service': {
                path: '@/src/services/logger',
                allowedImports: ['logger'],
              },
            };
          },
        },
      }),
      build: async (builder) => {
        const loggerFile = typescript.createTemplate(loggerServiceFileConfig);

        const loggerOptions = Object.keys(mixins.value()).length
          ? TypescriptCodeUtils.wrapExpression(
              TypescriptCodeUtils.mergeExpressionsAsObject(mixins.value()),
              TypescriptCodeUtils.createWrapper(
                (expression) => `{
              mixin() {
                return ${expression};
              }
            }`
              )
            )
          : TypescriptCodeUtils.createExpression('');

        loggerFile.addCodeExpression('LOGGER_OPTIONS', loggerOptions);

        await builder.apply(
          loggerFile.renderToAction('logger.ts', 'src/services/logger.ts')
        );
      },
    };
  },
});

export default LoggerServiceGenerator;
