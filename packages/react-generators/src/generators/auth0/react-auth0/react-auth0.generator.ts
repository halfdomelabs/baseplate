import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { reactAppConfigProvider } from '@src/generators/core/react-app/react-app.generator.js';
import { reactConfigProvider } from '@src/generators/core/react-config/react-config.generator.js';

const descriptorSchema = z.object({
  callbackPath: z.string().optional(),
});

export const reactAuth0Generator = createGenerator({
  name: 'auth0/react-auth0',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ callbackPath }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@auth0/auth0-react']),
    }),
    main: createGeneratorTask({
      dependencies: {
        reactConfig: reactConfigProvider,
        reactAppConfig: reactAppConfigProvider,
      },
      run({ reactConfig, reactAppConfig }) {
        reactConfig.getConfigMap().set('VITE_AUTH0_DOMAIN', {
          comment: 'Auth0 Domain',
          validator: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          devValue: 'domain.auth0.com',
        });

        reactConfig.getConfigMap().set('VITE_AUTH0_CLIENT_ID', {
          comment: 'Auth0 Client ID',
          validator: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          devValue: 'AUTH0_CLIENT_ID',
        });

        reactConfig.getConfigMap().set('VITE_AUTH0_AUDIENCE', {
          comment: 'Auth0 Audience',
          validator: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          devValue: 'AUTH0_AUDIENCE',
        });

        const redirectUri = callbackPath
          ? `\`\${window.location.origin}/${callbackPath}\``
          : 'window.location.origin';

        reactAppConfig.renderWrappers.set('react-auth0', {
          wrap: (contents) => TsCodeUtils.templateWithImports([
            tsImportBuilder(['Auth0Provider']).from('@auth0/auth0-react'),
            tsImportBuilder(['config']).from(
              reactConfig.getImportMap()['%react-config']?.path ?? '',
            ),
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
