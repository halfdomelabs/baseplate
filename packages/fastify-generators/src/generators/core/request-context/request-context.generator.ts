import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { loggerServiceSetupProvider } from '../logger-service/logger-service.generator.js';

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

export const requestContextGenerator = createGenerator({
  name: 'core/request-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    loggerRequestContext: createGeneratorTask({
      dependencies: { loggerServiceSetup: loggerServiceSetupProvider },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'reqId',
          tsCodeFragment(
            "requestContext.get('reqInfo')?.id",
            tsImportBuilder()
              .named('requestContext')
              .from('@fastify/request-context'),
          ),
        );

        return {};
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@fastify/request-context',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        typescript: typescriptProvider,
      },
      exports: {
        requestContext: requestContextProvider.export(projectScope),
      },
      run({ fastifyServerConfig, typescript }) {
        const config = createNonOverwriteableMap(
          {},
          { name: 'request-context-config' },
        );
        const requestContextPluginPath = '@/src/plugins/request-context.ts';
        fastifyServerConfig.plugins.set('requestContextPlugin', {
          plugin: tsCodeFragment(
            'requestContextPlugin',
            tsImportBuilder(['requestContextPlugin']).from(
              requestContextPluginPath,
            ),
          ),
        });
        return {
          providers: {
            requestContext: {
              getConfig: () => config,
              getRequestInfoType: () =>
                TypescriptCodeUtils.createExpression(
                  'RequestInfo',
                  "import type {RequestInfo} from '@/src/plugins/request-context.js",
                ),
            },
          },
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
    }),
  }),
});
