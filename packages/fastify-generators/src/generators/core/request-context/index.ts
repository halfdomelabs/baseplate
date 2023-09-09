import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { loggerServiceSetupProvider } from '../logger-service/index.js';

const descriptorSchema = z.object({});

export interface RequestContextGeneratorConfig {
  setting?: string;
}

export interface RequestContextProvider {
  getConfig(): NonOverwriteableMap<RequestContextGeneratorConfig>;
  getRequestInfoType(): TypescriptCodeExpression;
}

export const requestContextProvider =
  createProviderType<RequestContextProvider>('request-context', {
    isReadOnly: true,
  });

const RequestContextGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'logger-request-context',
      dependencies: { loggerServiceSetup: loggerServiceSetupProvider },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'reqId',
          TypescriptCodeUtils.createExpression(
            "requestContext.get('reqInfo')?.id",
            "import { requestContext } from '@fastify/request-context';",
          ),
        );

        return {};
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        fastifyServer: fastifyServerProvider,
      },
      exports: {
        requestContext: requestContextProvider,
      },
      run({ node, fastifyServer }) {
        const config = createNonOverwriteableMap(
          {},
          { name: 'request-context-config' },
        );
        node.addPackages({ '@fastify/request-context': '5.0.0' });
        fastifyServer.registerPlugin({
          name: 'requestContextPlugin',
          plugin: TypescriptCodeUtils.createExpression(
            'requestContextPlugin',
            "import {requestContextPlugin} from '@/src/plugins/request-context",
          ),
        });
        return {
          getProviders: () => ({
            requestContext: {
              getConfig: () => config,
              getRequestInfoType: () =>
                TypescriptCodeUtils.createExpression(
                  'RequestInfo',
                  "import type {RequestInfo} from '@/src/plugins/request-context'",
                ),
            },
          }),
          build: async (builder) => {
            await builder.apply(
              copyTypescriptFileAction({
                source: 'request-context.ts',
                destination: 'src/plugins/request-context.ts',
              }),
            );
          },
        };
      },
    });
  },
});

export default RequestContextGenerator;
