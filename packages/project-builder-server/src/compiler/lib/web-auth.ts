import type { AppConfig } from '@halfdomelabs/project-builder-lib';

import type { AppEntryBuilder } from '../app-entry-builder.js';

export function compileAuthFeatures(
  builder: AppEntryBuilder<AppConfig>,
): Record<string, unknown> | null {
  if (builder.appConfig.type === 'web' && !builder.appConfig.includeAuth) {
    return null;
  }
  if (builder.projectDefinition.auth?.useAuth0) {
    return {
      $auth: {
        generator: '@halfdomelabs/react/auth0/react-auth0',
        callbackPath: 'auth/auth0-callback',
      },
      $authHooks: {
        generator: '@halfdomelabs/react/auth0/auth0-hooks',
      },
      $authIdentify: {
        generator: '@halfdomelabs/react/auth/auth-identify',
      },
      $authApollo: {
        generator: '@halfdomelabs/react/auth0/auth0-apollo',
      },
      $authComponents: {
        generator: '@halfdomelabs/react/auth0/auth0-components',
        loginPath: '/auth/login',
      },
    };
  }
  return {
    $authService: {
      generator: '@halfdomelabs/react/auth/auth-service',
    },
    $authHooks: {
      generator: '@halfdomelabs/react/auth/auth-hooks',
    },
    $authIdentify: {
      generator: '@halfdomelabs/react/auth/auth-identify',
    },
    $authApollo: {
      generator: '@halfdomelabs/react/auth/auth-apollo',
    },
    $authComponents: {
      generator: '@halfdomelabs/react/auth/auth-components',
      loginPath: '/auth/login',
    },
  };
}

export function compileAuthPages(
  builder: AppEntryBuilder<AppConfig>,
  allowedRoles: string[] = [],
): unknown {
  if (builder.projectDefinition.auth?.useAuth0) {
    builder.addDescriptor('auth/root.json', {
      name: 'auth',
      generator: '@halfdomelabs/react/core/react-routes',
      children: {
        $auth: {
          generator: '@halfdomelabs/react/auth0/auth0-callback',
        },
      },
    });

    return 'auth/root';
  }

  builder.addDescriptor('auth/root.json', {
    name: 'auth',
    generator: '@halfdomelabs/react/core/react-routes',
    children: {
      $auth: {
        generator: '@halfdomelabs/react/auth/auth-pages',
        children: {
          login: {
            allowedRoles: allowedRoles.map((r) => builder.nameFromId(r)),
          },
        },
      },
    },
  });

  return 'auth/root';
}
