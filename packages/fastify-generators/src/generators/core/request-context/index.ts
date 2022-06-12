import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyServerProvider } from '../fastify-server';

const descriptorSchema = z.object({});

export interface RequestContextGeneratorConfig {
  setting?: string;
}

export interface RequestContextProvider {
  getConfig(): NonOverwriteableMap<RequestContextGeneratorConfig>;
  getRequestInfoType(): TypescriptCodeExpression;
}

export const requestContextProvider =
  createProviderType<RequestContextProvider>('request-context');

const RequestContextGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    fastifyServer: fastifyServerProvider,
  },
  exports: {
    requestContext: requestContextProvider,
  },
  createGenerator(descriptor, { node, fastifyServer }) {
    const config = createNonOverwriteableMap(
      {},
      { name: 'request-context-config' }
    );
    node.addPackages({ 'fastify-request-context': '^2.2.0' });
    fastifyServer.registerPlugin({
      name: 'requestContextPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'requestContextPlugin',
        "import {requestContextPlugin} from '@/src/plugins/request-context"
      ),
    });
    return {
      getProviders: () => ({
        requestContext: {
          getConfig: () => config,
          getRequestInfoType: () =>
            TypescriptCodeUtils.createExpression(
              'RequestInfo',
              "import type {RequestInfo} from '@/src/plugins/request-context'"
            ),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          copyTypescriptFileAction({
            source: 'request-context.ts',
            destination: 'src/plugins/request-context.ts',
          })
        );
      },
    };
  },
});

export default RequestContextGenerator;
