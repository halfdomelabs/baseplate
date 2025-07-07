import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  authContextTask,
  reactAppConfigProvider,
  reactAuthProvider,
  reactConfigImportsProvider,
  reactConfigProvider,
  reactRouterConfigProvider,
} from '@baseplate-dev/react-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_PACKAGES } from '#src/auth0/constants/packages.js';

import { AUTH0_REACT_AUTH0_GENERATED } from './generated';

const descriptorSchema = z.object({});

export const reactAuth0Generator = createGenerator({
  name: 'auth0/react-auth0',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH0_REACT_AUTH0_GENERATED.paths.task,
    renderers: AUTH0_REACT_AUTH0_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(AUTH0_PACKAGES, ['@auth0/auth0-react']),
    }),
    reactConfig: createProviderTask(reactConfigProvider, (reactConfig) => {
      reactConfig.configEntries.mergeObj({
        VITE_AUTH0_DOMAIN: {
          comment: 'Auth0 Domain',
          validator: 'z.string().min(1)',
          devDefaultValue: 'domain.auth0.com',
        },
        VITE_AUTH0_CLIENT_ID: {
          comment: 'Auth0 Client ID',
          validator: 'z.string().min(1)',
          devDefaultValue: 'AUTH0_CLIENT_ID',
        },
        VITE_AUTH0_AUDIENCE: {
          comment: 'Auth0 Audience',
          validator: 'z.string().min(1)',
          devDefaultValue: 'AUTH0_AUDIENCE',
        },
      });
    }),
    authContext: authContextTask,
    reactRouterContext: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
      },
      run({ reactRouterConfig }) {
        reactRouterConfig.routerSetupFragments.set(
          'auth0',
          tsTemplateWithImports(
            tsImportBuilder(['useAuth0']).from('@auth0/auth0-react'),
          )`const auth0 = useAuth0()`,
        );
        reactRouterConfig.rootContextFields.add({
          name: 'auth0',
          type: TsCodeUtils.typeImportFragment(
            'Auth0ContextInterface',
            '@auth0/auth0-react',
          ),
          optional: false,
          routerProviderInitializer: {
            code: tsTemplate`auth0`,
            dependencies: ['auth0'],
          },
        });
      },
    }),
    authLoadedGate: createGeneratorTask({
      dependencies: {
        renderers: AUTH0_REACT_AUTH0_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.authLoadedGate.render({}));
          },
        };
      },
    }),
    reactAuth: createGeneratorTask({
      exports: {
        reactAuth: reactAuthProvider.export(packageScope),
      },
      run() {
        return {
          providers: {
            reactAuth: {
              getLoginUrlPath: () => '/auth/login',
              getRegisterUrlPath: () => '/auth/login?screen_hint=signup',
            },
          },
        };
      },
    }),
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactConfigImports: reactConfigImportsProvider,
        reactAppConfig: reactAppConfigProvider,
        paths: AUTH0_REACT_AUTH0_GENERATED.paths.provider,
      },
      run({ reactConfigImports, reactAppConfig, paths }) {
        reactAppConfig.renderWrappers.set('react-auth0', {
          wrap: (contents) => TsCodeUtils.templateWithImports([
            tsImportBuilder(['Auth0Provider']).from('@auth0/auth0-react'),
            reactConfigImports.config.declaration(),
            tsImportBuilder(['AuthLoadedGate']).from(paths.authLoadedGate),
          ])`<Auth0Provider
        domain={config.VITE_AUTH0_DOMAIN}
        clientId={config.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: globalThis.location.origin,
          audience: config.VITE_AUTH0_AUDIENCE,
        }}
      ><AuthLoadedGate>${contents}</AuthLoadedGate></Auth0Provider>`,
          type: 'auth',
        });
      },
    }),
  }),
});
