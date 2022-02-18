import {
  mergeCodeImports,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
  copyTypescriptFileAction,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '../config-service';
import { loggerServiceProvider } from '../logger-service';
import { rootModuleProvider } from '../root-module';

const descriptorSchema = yup.object({
  defaultPort: yup.number().default(7001),
});

interface FastifyServerConfig {
  errorHandlerFunction: TypescriptCodeExpression;
}

interface FastifyServerPlugin {
  name: string;
  plugin: TypescriptCodeExpression;
  options?: TypescriptCodeExpression;
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
  },
  exports: {
    fastifyServer: fastifyServerProvider,
  },
  createGenerator(
    descriptor,
    { loggerService, configService, node, rootModule }
  ) {
    const configMap = createNonOverwriteableMap<FastifyServerConfig>(
      {
        errorHandlerFunction:
          TypescriptCodeUtils.createExpression('console.error'),
      },
      { name: 'fastify-server-config', defaultsOverwriteable: true }
    );
    const plugins: FastifyServerPlugin[] = [];

    node.addPackages({
      fastify: '^3.25.3',
      'fastify-helmet': '^6.0.0',
      'fastify-plugin': '^3.0.0',
      nanoid: '^3.1.30',
    });

    plugins.push({
      name: 'helmet',
      plugin: TypescriptCodeUtils.createExpression(
        'helmet',
        "import helmet from 'fastify-helmet'"
      ),
      options: TypescriptCodeUtils.createExpression(
        `{
          contentSecurityPolicy: false, // disable to enable Altair to function (alright since we're a backend service)
        }`
      ),
    });

    plugins.push({
      name: 'healthCheckPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'healthCheckPlugin',
        "import { healthCheckPlugin } from '@/src/plugins/health-check'"
      ),
    });

    configService.getConfigEntries().merge({
      SERVER_HOST: {
        comment: 'Hostname to bind the server to',
        value: TypescriptCodeUtils.createExpression('yup.string()'),
      },
      SERVER_PORT: {
        comment: 'Port to bind the server to',
        value: TypescriptCodeUtils.createExpression(
          `yup.number().default(${descriptor.defaultPort})`
        ),
      },
    });

    rootModule.addModuleField(
      'plugins',
      TypescriptCodeUtils.createExpression(
        '(FastifyPluginCallback | FastifyPluginAsync)',
        "import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';"
      )
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
        const indexFile = new TypescriptSourceFile({
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
          })
        );
        const configExpression = configService.getConfigExpression();
        indexFile.addCodeExpression(
          'SERVER_PORT',
          TypescriptCodeUtils.appendToExpression(
            configExpression,
            '.SERVER_PORT'
          )
        );
        indexFile.addCodeExpression(
          'SERVER_HOST',
          TypescriptCodeUtils.appendToExpression(
            configExpression,
            '.SERVER_HOST'
          )
        );

        await builder.apply(
          indexFile.renderToAction('index.ts', 'src/index.ts')
        );

        const serverFile = new TypescriptSourceFile({
          PLUGINS: { type: 'code-block' },
          ROOT_MODULE: { type: 'code-expression' },
        });
        serverFile.addCodeBlock(
          'PLUGINS',
          TypescriptCodeUtils.mergeBlocks(
            plugins.map((plugin) => {
              const options = plugin.options?.expression;
              return {
                type: 'code-block',
                code: `await fastify.register(${plugin.plugin.expression}${
                  options ? `, ${options}` : ''
                });`,
                ...mergeCodeImports([plugin.plugin, plugin.options || {}]),
              };
            })
          )
        );
        serverFile.addCodeExpression('ROOT_MODULE', rootModule.getRootModule());

        await builder.apply(
          serverFile.renderToAction('server.ts', 'src/server.ts')
        );
        await builder.apply(
          copyTypescriptFileAction({
            source: 'plugins/health-check.ts',
            destination: 'src/plugins/health-check.ts',
          })
        );
      },
    };
  },
});

export default FastifyServerGenerator;
