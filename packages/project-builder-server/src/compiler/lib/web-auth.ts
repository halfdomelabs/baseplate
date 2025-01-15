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
  authApolloGenerator,
  authComponentsGenerator,
  authHooksGenerator,
  authIdentifyGenerator,
  authLayoutGenerator,
  authLoginPageGenerator,
  authPagesGenerator,
  authServiceGenerator,
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
  if (builder.projectDefinition.auth?.useAuth0) {
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
  return {
    authService: authServiceGenerator({}),
    authHooks: authHooksGenerator({}),
    authIdentify: authIdentifyGenerator({}),
    authApollo: authApolloGenerator({}),
    authComponents: authComponentsGenerator({
      loginPath: '/auth/login',
    }),
  };
}

export function compileAuthPages(
  builder: AppEntryBuilder<AppConfig>,
  allowedRoles: string[] = [],
): GeneratorBundle {
  if (builder.projectDefinition.auth?.useAuth0) {
    return reactRoutesGenerator({
      name: 'auth',
      children: {
        auth: auth0CallbackGenerator({}),
      },
    });
  }

  return reactRoutesGenerator({
    name: 'auth',
    children: {
      auth: authPagesGenerator({
        children: {
          layout: authLayoutGenerator({
            name: 'AuthLayout',
          }),
          login: authLoginPageGenerator({
            allowedRoles: allowedRoles.map((r) => builder.nameFromId(r)),
          }),
        },
      }),
    },
  });
}
