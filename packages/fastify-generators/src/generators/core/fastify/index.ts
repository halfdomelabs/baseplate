import {
  nodeGitIgnoreProvider,
  nodeProvider,
  typescriptConfigProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { setupFastifyTypescript } from './setupFastifyTypescript';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface FastifyGeneratorConfig {
  /**
   * Command to pipe the dev output into, e.g. pino-pretty
   */
  devOutputFormatter?: string;
  /**
   * Loaders to register when running in dev
   */
  devLoaders?: string[];
}

export interface FastifyProvider {
  getConfig: () => NonOverwriteableMap<FastifyGeneratorConfig>;
}

export const fastifyProvider = createProviderType<FastifyProvider>('fastify');

export interface FastifyOutputProvider {
  getDevLoaderString(): string;
}

export const fastifyOutputProvider =
  createProviderType<FastifyOutputProvider>('fastify-output');

const FastifyGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    logger: {
      provider: 'logger-service',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/logger-service',
        peerProvider: true,
      },
    },
    rootModule: {
      provider: 'root-module',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/root-module',
        peerProvider: true,
      },
    },
    errorHandler: {
      provider: 'error-handler-service',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/error-handler-service',
        peerProvider: true,
      },
    },
    config: {
      provider: 'config-service',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/config-service',
        peerProvider: true,
      },
    },
    server: {
      provider: 'fastify-server',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/fastify-server',
        peerProvider: true,
      },
    },
    healthCheck: {
      provider: 'fastify-health-check',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/fastify-health-check',
        peerProvider: true,
      },
    },
    requestContext: {
      provider: 'request-context',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/request-context',
        peerProvider: true,
      },
    },
    gracefulShutdown: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/fastify-graceful-shutdown',
      },
    },
    jest: {
      provider: 'fastify-jest',
      defaultDescriptor: {
        generator: '@baseplate/fastify/jest/fastify-jest',
        peerProvider: true,
      },
    },
    serviceContext: {
      provider: 'service-context',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/service-context',
        peerProvider: true,
      },
    },
    requestServiceContext: {
      provider: 'request-service-context',
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/request-service-context',
        peerProvider: true,
      },
    },
    cookies: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/fastify-cookie-context',
      },
    },
    scripts: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/core/fastify-scripts',
      },
    },
  }),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'typescript',
      dependencies: {
        node: nodeProvider,
        typescriptConfig: typescriptConfigProvider,
      },
      run({ node, typescriptConfig }) {
        setupFastifyTypescript(node, typescriptConfig);
        return {};
      },
    });

    const mainTask = taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        nodeGitIgnore: nodeGitIgnoreProvider,
      },
      exports: {
        fastify: fastifyProvider,
      },
      run({ node, nodeGitIgnore }) {
        const config = createNonOverwriteableMap<FastifyGeneratorConfig>(
          { devLoaders: ['tsconfig-paths/register'] },
          { name: 'fastify-config', mergeArraysUniquely: true }
        );

        node.mergeExtraProperties({
          main: 'dist/index.js',
        });

        nodeGitIgnore.addExclusions(['/dist']);

        const formatDevLoaders = (loaders: string[]): string =>
          (loaders || []).map((loader) => `-r ${loader}`).join(' ');

        return {
          getProviders: () => ({
            fastify: {
              getConfig: () => config,
            },
          }),
          build() {
            // add scripts
            const { devOutputFormatter, devLoaders } = config.value();
            const devRegister = formatDevLoaders(devLoaders || []);
            const devCommand = `ts-node-dev --rs --transpile-only --respawn ${devRegister} src${
              devOutputFormatter ? ` | ${devOutputFormatter}` : ''
            }`;
            node.addScripts({
              build: 'tsc && tsc-alias',
              start: 'node ./dist',
              dev: devCommand,
            });

            return { formatDevLoaders, config };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'output',
      taskDependencies: { mainTask },
      exports: { fastifyOutput: fastifyOutputProvider },
      run(deps, { mainTask: { formatDevLoaders, config } }) {
        return {
          getProviders() {
            return {
              fastifyOutput: {
                getDevLoaderString: () =>
                  formatDevLoaders(config.get('devLoaders') || []),
              },
            };
          },
          build() {},
        };
      },
    });
  },
});

export default FastifyGenerator;
