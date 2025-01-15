import {
  nodeProvider,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactAppProvider } from '@src/generators/core/react-app/index.js';
import { reactConfigProvider } from '@src/generators/core/react-config/index.js';

const descriptorSchema = z.object({
  callbackPath: z.string().optional(),
});

export const reactAuth0Generator = createGenerator({
  name: 'auth0/react-auth0',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { callbackPath }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        reactConfig: reactConfigProvider,
        reactApp: reactAppProvider,
      },
      run({ node, reactConfig, reactApp }) {
        node.addPackages({
          '@auth0/auth0-react': '2.2.3',
        });

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

        reactApp.getRenderWrappers().addItem(
          'react-auth0',
          TypescriptCodeUtils.createWrapper(
            (contents) => `<Auth0Provider
        domain={config.VITE_AUTH0_DOMAIN}
        clientId={config.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: ${redirectUri},
          audience: config.VITE_AUTH0_AUDIENCE,
        }}
        skipRedirectCallback
      >${contents}</Auth0Provider>`,
            [
              `import {Auth0Provider} from '@auth0/auth0-react';`,
              `import {config} from '%react-config'`,
            ],
            { importMappers: [reactConfig] },
          ),
          { comesAfter: 'react-apollo' },
        );
      },
    });
  },
});
