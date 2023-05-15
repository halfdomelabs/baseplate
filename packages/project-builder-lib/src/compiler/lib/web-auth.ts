import { AppConfig } from '@src/schema/index.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';

export function compileAuthFeatures(
  builder: AppEntryBuilder<AppConfig>
): Record<string, unknown> | null {
  if (builder.projectConfig.auth?.useAuth0) {
    return {
      $auth: {
        generator: '@halfdomelabs/react/auth0/react-auth0',
        peerProvider: true,
        callbackPath: 'auth/auth0-callback',
      },
      $authHooks: {
        generator: '@halfdomelabs/react/auth0/auth0-hooks',
        peerProvider: true,
      },
      $authIdentify: {
        generator: '@halfdomelabs/react/auth/auth-identify',
        peerProvider: true,
      },
      $authApollo: {
        generator: '@halfdomelabs/react/auth0/auth0-apollo',
      },
      $authComponents: {
        generator: '@halfdomelabs/react/auth0/auth0-components',
        loginPath: '/auth/login',
        peerProvider: true,
      },
    };
  }
  return {
    $authService: {
      generator: '@halfdomelabs/react/auth/auth-service',
      peerProvider: true,
    },
    $authHooks: {
      generator: '@halfdomelabs/react/auth/auth-hooks',
      peerProvider: true,
    },
    $authIdentify: {
      generator: '@halfdomelabs/react/auth/auth-identify',
      peerProvider: true,
    },
    $authApollo: {
      generator: '@halfdomelabs/react/auth/auth-apollo',
    },
    $authComponents: {
      generator: '@halfdomelabs/react/auth/auth-components',
      loginPath: '/auth/login',
      peerProvider: true,
    },
  };
}

export function compileAuthPages(
  builder: AppEntryBuilder<AppConfig>,
  allowedRoles: string[] = []
): unknown {
  if (builder.projectConfig.auth?.useAuth0) {
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
            allowedRoles,
          },
        },
      },
    },
  });

  return 'auth/root';
}
