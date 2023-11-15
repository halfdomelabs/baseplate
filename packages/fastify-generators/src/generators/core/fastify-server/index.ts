import {
  mergeCodeEntryOptions,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import { loggerServiceProvider } from '../logger-service/index.js';
import { rootModuleProvider } from '../root-module/index.js';

const descriptorSchema = z.object({
  defaultPort: z.number().default(7001),
});

interface FastifyServerConfig {
  errorHandlerFunction: TypescriptCodeExpression;
}

interface FastifyServerPlugin {
  name: string;
  plugin: TypescriptCodeExpression;
  options?: TypescriptCodeExpression;
  orderPriority?: 'EARLY' | 'MIDDLE' | 'END';
}

export interface FastifyServerProvider {
  getConfig(): NonOverwriteableMap<FastifyServerConfig>;
  registerPlugin(plugin: FastifyServerPlugin): void;
}

export const fastifyServerProvider =
  createProviderType<FastifyServerProvider>('fastify-server');

const FastifyServerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    loggerService: loggerServiceProvider,
    configService: configServiceProvider,
    rootModule: rootModuleProvider,
    typescript: typescriptProvider,
  },
  exports: {
    fastifyServer: fastifyServerProvider,
  },
  createGenerator(
    descriptor,
    { loggerService, configService, node, rootModule, typescript },
  ) {
    const configMap = createNonOverwriteableMap<FastifyServerConfig>(
      {
        errorHandlerFunction:
          TypescriptCodeUtils.createExpression('console.error'),
      },
      { name: 'fastify-server-config', defaultsOverwriteable: true },
    );
    const plugins: FastifyServerPlugin[] = [];

    node.addPackages({
      fastify: '4.19.2',
      '@fastify/helmet': '11.0.0',
      'fastify-plugin': '4.5.0',
      nanoid: '3.3.6',
    });

    plugins.push({
      name: 'helmet',
      plugin: TypescriptCodeUtils.createExpression(
        'helmet',
        "import helmet from '@fastify/helmet'",
      ),
      options: TypescriptCodeUtils.createExpression(
        `{
          // disable to enable Altair to function (alright since we're a backend service)
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
        }`,
      ),
      orderPriority: 'EARLY',
    });

    configService.getConfigEntries().merge({
      SERVER_HOST: {
        comment: 'Hostname to bind the server to',
        value: TypescriptCodeUtils.createExpression(
          "z.string().default('localhost')",
        ),
      },
      SERVER_PORT: {
        comment: 'Port to bind the server to',
        value: TypescriptCodeUtils.createExpression(
          `z.coerce.number().min(1).max(65535).default(${descriptor.defaultPort})`,
        ),
      },
    });

    rootModule.addModuleField(
      'plugins',
      TypescriptCodeUtils.createExpression(
        '(FastifyPluginCallback | FastifyPluginAsync)',
        "import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';",
      ),
    );

    return {
      getProviders: () => ({
        fastifyServer: {
          getConfig: () => configMap,
          registerPlugin: (plugin) => plugins.push(plugin),
        },
      }),
      build: async (builder) => {
        const config = configMap.value();
        const indexFile = typescript.createTemplate({
          LOG_ERROR: { type: 'code-expression' },
          SERVER_OPTIONS: { type: 'code-expression' },
          SERVER_PORT: { type: 'code-expression' },
          SERVER_HOST: { type: 'code-expression' },
        });
        indexFile.addCodeExpression('LOG_ERROR', config.errorHandlerFunction);
        indexFile.addCodeExpression(
          'SERVER_OPTIONS',
          TypescriptCodeUtils.mergeExpressionsAsObject({
            logger: loggerService.getLogger(),
          }),
        );
        const configExpression = configService.getConfigExpression();
        indexFile.addCodeExpression(
          'SERVER_PORT',
          TypescriptCodeUtils.appendToExpression(
            configExpression,
            '.SERVER_PORT',
          ),
        );
        indexFile.addCodeExpression(
          'SERVER_HOST',
          TypescriptCodeUtils.appendToExpression(
            configExpression,
            '.SERVER_HOST',
          ),
        );

        await builder.apply(
          indexFile.renderToAction('index.ts', 'src/index.ts'),
        );

        const serverFile = typescript.createTemplate({
          PLUGINS: { type: 'code-block' },
          ROOT_MODULE: { type: 'code-expression' },
        });

        const orderedPlugins = R.sortBy((plugin) => {
          switch (plugin.orderPriority) {
            case 'EARLY':
              return 0;
            case 'END':
              return 2;
            case 'MIDDLE':
            default:
              return 1;
          }
        }, plugins);

        serverFile.addCodeBlock(
          'PLUGINS',
          TypescriptCodeUtils.mergeBlocks(
            orderedPlugins.map((plugin) => {
              const options = plugin.options?.content;
              return new TypescriptCodeBlock(
                `await fastify.register(${plugin.plugin.content}${
                  options ? `, ${options}` : ''
                });`,
                null,
                mergeCodeEntryOptions([plugin.plugin, plugin.options]),
              );
            }),
          ),
        );
        serverFile.addCodeExpression('ROOT_MODULE', rootModule.getRootModule());

        await builder.apply(
          serverFile.renderToAction('server.ts', 'src/server.ts'),
        );
      },
    };
  },
});

export default FastifyServerGenerator;
