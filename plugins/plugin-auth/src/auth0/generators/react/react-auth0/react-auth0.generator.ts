import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  authContextTask,
  reactAppConfigProvider,
  reactComponentsImportsProvider,
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

const descriptorSchema = z.object({
  callbackPath: z.string().optional(),
});

export const reactAuth0Generator = createGenerator({
  name: 'auth0/react-auth0',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ callbackPath }) => ({
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
    reactRouterGate: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ reactRouterConfig, reactComponentsImports }) {
        reactRouterConfig.routerSetupFragments.set(
          'auth0',
          tsTemplateWithImports(
            tsImportBuilder(['useAuth0']).from('@auth0/auth0-react'),
          )`const { isLoading, error } = useAuth0()`,
        );
        reactRouterConfig.routerBodyFragments.set(
          'auth0-gate',
          tsTemplate`if (isLoading) return <${reactComponentsImports.ErrorableLoader.fragment()} error={error} />`,
        );
      },
    }),
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactConfigImports: reactConfigImportsProvider,
        reactAppConfig: reactAppConfigProvider,
      },
      run({ reactConfigImports, reactAppConfig }) {
        const redirectUri = callbackPath
          ? `\`\${globalThis.location.origin}/${callbackPath}\``
          : 'globalThis.location.origin';

        reactAppConfig.renderWrappers.set('react-auth0', {
          wrap: (contents) => TsCodeUtils.templateWithImports([
            tsImportBuilder(['Auth0Provider']).from('@auth0/auth0-react'),
            reactConfigImports.config.declaration(),
          ])`<Auth0Provider
        domain={config.VITE_AUTH0_DOMAIN}
        clientId={config.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: ${redirectUri},
          audience: config.VITE_AUTH0_AUDIENCE,
        }}
        skipRedirectCallback
      >${contents}</Auth0Provider>`,
          type: 'auth',
        });
      },
    }),
  }),
});
