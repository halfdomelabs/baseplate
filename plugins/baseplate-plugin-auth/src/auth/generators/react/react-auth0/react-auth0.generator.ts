import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import {
  reactAppConfigProvider,
  reactConfigImportsProvider,
  reactConfigProvider,
} from '@halfdomelabs/react-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { AUTH_PACKAGES } from '@src/auth/constants/packages';

const descriptorSchema = z.object({
  callbackPath: z.string().optional(),
});

export const reactAuthGenerator = createGenerator({
  name: 'auth/react-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ callbackPath }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(AUTH_PACKAGES, ['@auth/auth-react']),
    }),
    reactConfig: createProviderTask(reactConfigProvider, (reactConfig) => {
      reactConfig.configEntries.mergeObj({
        VITE_AUTH_DOMAIN: {
          comment: 'Auth Domain',
          validator: 'z.string().min(1)',
          devDefaultValue: 'domain.auth.com',
        },
        VITE_AUTH_CLIENT_ID: {
          comment: 'Auth Client ID',
          validator: 'z.string().min(1)',
          devDefaultValue: 'AUTH_CLIENT_ID',
        },
        VITE_AUTH_AUDIENCE: {
          comment: 'Auth Audience',
          validator: 'z.string().min(1)',
          devDefaultValue: 'AUTH_AUDIENCE',
        },
      });
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

        reactAppConfig.renderWrappers.set('react-auth', {
          wrap: (contents) => TsCodeUtils.templateWithImports([
            tsImportBuilder(['AuthProvider']).from('@auth/auth-react'),
            reactConfigImports.config.declaration(),
          ])`<AuthProvider
        domain={config.VITE_AUTH_DOMAIN}
        clientId={config.VITE_AUTH_CLIENT_ID}
        authorizationParams={{
          redirect_uri: ${redirectUri},
          audience: config.VITE_AUTH_AUDIENCE,
        }}
        skipRedirectCallback
      >${contents}</AuthProvider>`,
          type: 'auth',
        });
      },
    }),
  }),
});
