import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  nodeGitIgnoreProvider,
  nodeProvider,
  nodeSetupProvider,
  projectScope,
  typescriptConfigProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { setupFastifyTypescript } from './setup-fastify-typescript.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

type NodeFlagUseCase = 'dev-env' | 'instrument';

interface NodeFlag {
  flag: string;
  /**
   * The type of flag that is used
   *
   * 'dev-env': For setting up environment variables in dev
   * 'instrument': For instrumenting the code
   */
  useCase: NodeFlagUseCase;
  targetEnvironment: 'dev' | 'prod';
}

export interface FastifyGeneratorConfig {
  /**
   * Command to pipe the dev output into, e.g. pino-pretty
   */
  devOutputFormatter?: string;
  nodeFlags: NodeFlag[];
}

export interface FastifyProvider {
  getConfig: () => NonOverwriteableMap<FastifyGeneratorConfig>;
}

export const fastifyProvider = createProviderType<FastifyProvider>('fastify');

export interface FastifyOutputProvider {
  getNodeFlags(): NodeFlag[];
  getNodeFlagsDev(useCase?: NodeFlagUseCase): string[];
  getNodeFlagsProd(useCase?: NodeFlagUseCase): string[];
  getDevOutputFormatter(): string | undefined;
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
      },
    },
    rootModule: {
      provider: 'root-module',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/root-module',
      },
    },
    errorHandler: {
      provider: 'error-handler-service',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/error-handler-service',
      },
    },
    config: {
      provider: 'config-service',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/config-service',
      },
    },
    server: {
      provider: 'fastify-server',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-server',
      },
    },
    healthCheck: {
      provider: 'fastify-health-check',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-health-check',
      },
    },
    requestContext: {
      provider: 'request-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/request-context',
      },
    },
    gracefulShutdown: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/fastify-graceful-shutdown',
      },
    },
    vitest: {
      provider: 'fastify-vitest',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/vitest/fastify-vitest',
      },
    },
    serviceContext: {
      provider: 'service-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/service-context',
      },
    },
    requestServiceContext: {
      provider: 'request-service-context',
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/core/request-service-context',
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
      name: 'node-setup',
      dependencies: {
        nodeSetup: nodeSetupProvider,
      },
      run({ nodeSetup }) {
        nodeSetup.setIsEsm(false);
        return {};
      },
    });

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
        fastify: fastifyProvider.export(projectScope),
      },
      run({ node, nodeGitIgnore }) {
        const config = createNonOverwriteableMap<FastifyGeneratorConfig>(
          { nodeFlags: [] },
          { name: 'fastify-config', mergeArraysUniquely: true },
        );

        node.mergeExtraProperties({
          main: 'dist/index.js',
          files: ['dist/**/*', 'package.json', 'README.md'],
        });

        nodeGitIgnore.addExclusions(['/dist']);

        return {
          getProviders: () => ({
            fastify: {
              getConfig: () => config,
            },
          }),
          build() {
            // add scripts
            const { devOutputFormatter, nodeFlags } = config.value();

            const outputFormatter = devOutputFormatter
              ? `| ${devOutputFormatter}`
              : '';
            const devCommand = [
              'tsx watch --clear-screen=false',
              ...nodeFlags
                .filter((f) => f.targetEnvironment === 'dev')
                .map((f) => f.flag),
              'src/index.ts',
              outputFormatter,
            ]
              .filter(Boolean)
              .join(' ');
            const startCommand = [
              'node',
              ...nodeFlags
                .filter((f) => f.targetEnvironment === 'prod')
                .map((f) => f.flag),
              'dist/index.js',
            ].join(' ');

            node.addScripts({
              build: 'tsc && tsc-alias',
              start: startCommand,
              dev: devCommand,
            });

            return { nodeFlags, devOutputFormatter };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'output',
      taskDependencies: { mainTask },
      exports: {
        fastifyOutput: fastifyOutputProvider.export(projectScope),
      },
      run(deps, { mainTask: { nodeFlags, devOutputFormatter } }) {
        return {
          getProviders() {
            return {
              fastifyOutput: {
                getNodeFlags: () => nodeFlags,
                getNodeFlagsDev: (useCase) =>
                  nodeFlags
                    .filter(
                      (f) =>
                        f.targetEnvironment === 'dev' &&
                        (!useCase || f.useCase === useCase),
                    )
                    .map((f) => f.flag),
                getNodeFlagsProd: (useCase) =>
                  nodeFlags
                    .filter(
                      (f) =>
                        f.targetEnvironment === 'prod' &&
                        (!useCase || f.useCase === useCase),
                    )
                    .map((f) => f.flag),
                getDevOutputFormatter: () => devOutputFormatter,
              },
            };
          },
        };
      },
    });
  },
});

export default FastifyGenerator;
