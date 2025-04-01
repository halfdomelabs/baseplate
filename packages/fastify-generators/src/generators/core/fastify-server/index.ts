import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  mergeCodeEntryOptions,
  nodeProvider,
  projectScope,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { configServiceProvider } from '../config-service/index.js';
import { loggerServiceProvider } from '../logger-service/index.js';
import {
  rootModuleConfigProvider,
  rootModuleImportProvider,
} from '../root-module/index.js';

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
  addInitializerBlock(block: string): void;
  addPrePluginBlock(block: TypescriptCodeBlock): void;
}

export const fastifyServerProvider =
  createProviderType<FastifyServerProvider>('fastify-server');

export const fastifyServerGenerator = createGenerator({
  name: 'core/fastify-server',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => [
    createGeneratorTask({
      name: 'root-module-config',
      dependencies: {
        rootModuleConfig: rootModuleConfigProvider,
      },
      run({ rootModuleConfig }, { taskId }) {
        rootModuleConfig.moduleFields.set(
          'plugins',
          TypescriptCodeUtils.createExpression(
            '(FastifyPluginCallback | FastifyPluginAsync)',
            "import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';",
          ),
          taskId,
        );
      },
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        loggerService: loggerServiceProvider,
        configService: configServiceProvider,
        rootModule: rootModuleImportProvider,
        typescript: typescriptProvider,
      },
      exports: {
        fastifyServer: fastifyServerProvider.export(projectScope),
      },
      run({ loggerService, configService, node, rootModule, typescript }) {
        const configMap = createNonOverwriteableMap<FastifyServerConfig>(
          {
            errorHandlerFunction:
              TypescriptCodeUtils.createExpression('console.error'),
          },
          { name: 'fastify-server-config', defaultsOverwriteable: true },
        );
        const plugins: FastifyServerPlugin[] = [];
        const initializerBlocks: string[] = [];
        const prePluginBlocks: TypescriptCodeBlock[] = [];

        node.addPackages({
          fastify: FASTIFY_PACKAGES.fastify,
          '@fastify/helmet': FASTIFY_PACKAGES['@fastify/helmet'],
          'fastify-plugin': FASTIFY_PACKAGES['fastify-plugin'],
          nanoid: FASTIFY_PACKAGES.nanoid,
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

        return {
          providers: {
            fastifyServer: {
              getConfig: () => configMap,
              registerPlugin: (plugin) => plugins.push(plugin),
              addPrePluginBlock(block) {
                prePluginBlocks.push(block);
              },
              addInitializerBlock(block) {
                initializerBlocks.push(block);
              },
            },
          },
          build: async (builder) => {
            const config = configMap.value();
            const indexFile = typescript.createTemplate({
              LOG_ERROR: { type: 'code-expression' },
              SERVER_OPTIONS: { type: 'code-expression' },
              SERVER_PORT: { type: 'code-expression' },
              SERVER_HOST: { type: 'code-expression' },
            });
            indexFile.addPreImportBlock(initializerBlocks.join('\n'));
            indexFile.addCodeExpression(
              'LOG_ERROR',
              config.errorHandlerFunction,
            );
            indexFile.addCodeExpression(
              'SERVER_OPTIONS',
              TypescriptCodeUtils.mergeExpressionsAsObject({
                loggerInstance: loggerService.getLogger(),
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
              PRE_PLUGIN_BLOCKS:
                TypescriptCodeUtils.mergeBlocks(prePluginBlocks),
              PLUGINS: { type: 'code-block' },
              ROOT_MODULE: { type: 'code-expression' },
            });

            const orderedPlugins = sortBy(plugins, [
              (plugin) => {
                switch (plugin.orderPriority) {
                  case 'EARLY': {
                    return 0;
                  }
                  case 'END': {
                    return 2;
                  }
                  default: {
                    return 1;
                  }
                }
              },
            ]);

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
            serverFile.addCodeExpression(
              'ROOT_MODULE',
              rootModule.getRootModule(),
            );

            await builder.apply(
              serverFile.renderToAction('server.ts', 'src/server.ts'),
            );
          },
        };
      },
    }),
  ],
});
