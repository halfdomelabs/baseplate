import {
  nodeProvider,
  typescriptConfigProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { setupFastifyTypescript } from './setupFastifyTypescript';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
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

const FastifyGenerator = createGeneratorWithChildren({
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
  }),
  dependencies: {
    node: nodeProvider,
    typescriptConfig: typescriptConfigProvider,
  },
  exports: {
    fastify: fastifyProvider,
  },
  createGenerator(descriptor, { node, typescriptConfig }) {
    const config = createNonOverwriteableMap<FastifyGeneratorConfig>(
      { devLoaders: ['tsconfig-paths/register'] },
      { name: 'fastify-config', mergeArraysUniquely: true }
    );

    setupFastifyTypescript(node, typescriptConfig);

    return {
      getProviders: () => ({
        fastify: {
          getConfig: () => config,
        },
      }),
      build: () => {
        // add scripts
        const { devOutputFormatter, devLoaders } = config.value();
        const devRegister = (devLoaders || [])
          .map((loader) => `-r ${loader}`)
          .join(' ');
        const devCommand = `ts-node-dev --rs --transpile-only --respawn ${devRegister} src${
          devOutputFormatter ? ` | ${devOutputFormatter}` : ''
        }`;
        node.addScripts({
          build: 'tsc && tsc-alias',
          start: 'node ./dist',
          dev: devCommand,
        });
      },
    };
  },
});

export default FastifyGenerator;
