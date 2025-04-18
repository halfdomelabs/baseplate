import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { loggerServiceSetupProvider } from '../logger-service/logger-service.generator.js';
import {
  createRequestContextImports,
  requestContextImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REQUEST_CONTEXT_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const requestContextPluginPath = '@/src/plugins/request-context.ts';

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
    fastifyServerConfig: createProviderTask(
      fastifyServerConfigProvider,
      (fastifyServerConfig) => {
        fastifyServerConfig.plugins.set('requestContextPlugin', {
          plugin: tsCodeFragment(
            'requestContextPlugin',
            tsImportBuilder(['requestContextPlugin']).from(
              requestContextPluginPath,
            ),
          ),
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        requestContextImports:
          requestContextImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        return {
          providers: {
            requestContextImports: createRequestContextImports('@/src/plugins'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REQUEST_CONTEXT_TS_TEMPLATES.requestContext,
                destination: requestContextPluginPath,
              }),
            );
          },
        };
      },
    }),
  }),
});

export { requestContextImportsProvider } from './generated/ts-import-maps.js';
