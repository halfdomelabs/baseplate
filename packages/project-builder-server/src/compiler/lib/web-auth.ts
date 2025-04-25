import type { AppConfig } from '@halfdomelabs/project-builder-lib';
import type {
  GeneratorBundle,
  GeneratorBundleChildren,
} from '@halfdomelabs/sync';

import {
  auth0ApolloGenerator,
  auth0CallbackGenerator,
  auth0ComponentsGenerator,
  auth0HooksGenerator,
  authIdentifyGenerator,
  reactAuth0Generator,
  reactRoutesGenerator,
} from '@halfdomelabs/react-generators';

import type { AppEntryBuilder } from '../app-entry-builder.js';

export function compileAuthFeatures(
  builder: AppEntryBuilder<AppConfig>,
): GeneratorBundleChildren | undefined {
  if (builder.appConfig.type === 'web' && !builder.appConfig.includeAuth) {
    return undefined;
  }
  if (!builder.projectDefinition.auth?.useAuth0) {
    throw new Error('Auth0 is not enabled');
  }
  return {
    auth: reactAuth0Generator({
      callbackPath: 'auth/auth0-callback',
    }),
    authHooks: auth0HooksGenerator({}),
    authIdentify: authIdentifyGenerator({}),
    auth0Apollo: auth0ApolloGenerator({}),
    auth0Components: auth0ComponentsGenerator({}),
  };
}

export function compileAuthPages(
  builder: AppEntryBuilder<AppConfig>,
): GeneratorBundle {
  if (!builder.projectDefinition.auth?.useAuth0) {
    throw new Error('Auth0 is not enabled');
  }
  return reactRoutesGenerator({
    id: 'auth',
    name: 'auth',
    children: {
      auth: auth0CallbackGenerator({}),
    },
  });
}
