import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { loggerServiceConfigProvider } from '#src/generators/core/index.js';
import { requestServiceContextConfigProvider } from '#src/generators/core/request-service-context/index.js';
import { serviceContextConfigProvider } from '#src/generators/core/service-context/index.js';

import { AUTH_AUTH_CONTEXT_GENERATED } from './generated/index.js';
import { authContextImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export const authContextGenerator = createGenerator({
  name: 'auth/auth-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_AUTH_CONTEXT_GENERATED.paths.task,
    imports: AUTH_AUTH_CONTEXT_GENERATED.imports.task,
    renderers: AUTH_AUTH_CONTEXT_GENERATED.renderers.task,
    requestServiceContextConfig: createProviderTask(
      requestServiceContextConfigProvider,
      (requestServiceContextConfig) => {
        requestServiceContextConfig.contextPassthroughs.set('auth', {
          name: 'auth',
          creator: (req) => tsCodeFragment(`${req}.auth`),
        });
      },
    ),
    loggerSetup: createGeneratorTask({
      dependencies: {
        loggerServiceConfig: loggerServiceConfigProvider,
      },
      run({ loggerServiceConfig }) {
        loggerServiceConfig.mixins.set(
          'userId',
          tsCodeFragment(
            "requestContext.get('userId')",
            tsImportBuilder()
              .named('requestContext')
              .from('@fastify/request-context'),
          ),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        serviceContextConfig: serviceContextConfigProvider,
        authContextImports: authContextImportsProvider,
        renderers: AUTH_AUTH_CONTEXT_GENERATED.renderers.provider,
      },
      run({ serviceContextConfig, authContextImports, renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.mainGroup.render({}));

            serviceContextConfig.contextFields.set('auth', {
              type: authContextImports.AuthContext.typeFragment(),
              setter: 'auth',
              creatorArguments: [
                {
                  name: 'auth',
                  type: authContextImports.AuthContext.typeFragment(),
                  testDefault: TsCodeUtils.template`${authContextImports.createAuthContextFromSessionInfo.fragment()}(undefined)`,
                },
              ],
            });
          },
        };
      },
    }),
  }),
});
