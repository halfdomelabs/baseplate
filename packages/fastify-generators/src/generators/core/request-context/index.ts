import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
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
        typescript: typescriptProvider,
      },
      exports: {
        requestContext: requestContextProvider.export(projectScope),
      },
      run({ node, fastifyServer, typescript }) {
        const config = createNonOverwriteableMap(
          {},
          { name: 'request-context-config' },
        );
        node.addPackages({ '@fastify/request-context': '6.0.1' });
        fastifyServer.registerPlugin({
          name: 'requestContextPlugin',
          plugin: TypescriptCodeUtils.createExpression(
            'requestContextPlugin',
            "import {requestContextPlugin} from '@/src/plugins/request-context.js'",
          ),
        });
        return {
          getProviders: () => ({
            requestContext: {
              getConfig: () => config,
              getRequestInfoType: () =>
                TypescriptCodeUtils.createExpression(
                  'RequestInfo',
                  "import type {RequestInfo} from '@/src/plugins/request-context.js",
                ),
            },
          }),
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
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
