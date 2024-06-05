import {
  nodeGitIgnoreProvider,
  nodeProvider,
  typescriptConfigProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { setupFastifyTypescript } from './setupFastifyTypescript.js';

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
  devLoaders: string[];
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
        generator: '@halfdomelabs/fastify/core/logger-service',
        peerProvider: true,
      },
    },
    rootModule: {
      provider: 'root-module',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/root-module',
        peerProvider: true,
      },
    },
    errorHandler: {
      provider: 'error-handler-service',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/error-handler-service',
        peerProvider: true,
      },
    },
    config: {
      provider: 'config-service',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/config-service',
        peerProvider: true,
      },
    },
    server: {
      provider: 'fastify-server',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-server',
        peerProvider: true,
      },
    },
    healthCheck: {
      provider: 'fastify-health-check',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-health-check',
        peerProvider: true,
      },
    },
    requestContext: {
      provider: 'request-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/request-context',
        peerProvider: true,
      },
    },
    gracefulShutdown: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-graceful-shutdown',
      },
    },
    // jest: {
    //   provider: 'fastify-jest',
    //   defaultDescriptor: {
    //     generator: '@halfdomelabs/fastify/jest/fastify-jest',
    //     peerProvider: true,
    //   },
    // },
    vitest: {
      provider: 'fastify-vitest',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/vitest/fastify-vitest',
        peerProvider: true,
      },
    },
    serviceContext: {
      provider: 'service-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/service-context',
        peerProvider: true,
      },
    },
    requestServiceContext: {
      provider: 'request-service-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/request-service-context',
        peerProvider: true,
      },
    },
    cookies: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-cookie-context',
      },
    },
    scripts: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-scripts',
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
          { devLoaders: [] },
          { name: 'fastify-config', mergeArraysUniquely: true },
        );

        node.mergeExtraProperties({
          main: 'dist/index.js',
        });

        nodeGitIgnore.addExclusions(['/dist']);

        const formatDevLoaders = (loaders: string[]): string =>
          (loaders ?? []).map((loader) => `-r ${loader}`).join(' ');

        return {
          getProviders: () => ({
            fastify: {
              getConfig: () => config,
            },
          }),
          build() {
            // add scripts
            const { devOutputFormatter, devLoaders } = config.value();
            const devRegister = formatDevLoaders(devLoaders ?? []);
            const devCommand = `tsx watch --clear-screen=false ${devRegister} src/index.ts${
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
                  formatDevLoaders(config.get('devLoaders') ?? []),
              },
            };
          },
        };
      },
    });
  },
});

export default FastifyGenerator;
