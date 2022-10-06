import { AppConfig } from '@src/schema';
import { AppEntryBuilder } from '../appEntryBuilder';

export function compileAuthFeatures(
  builder: AppEntryBuilder<AppConfig>
): Record<string, unknown> | null {
  if (builder.projectConfig.auth?.useAuth0) {
    return {
      $auth: {
        generator: '@baseplate/react/auth0/react-auth0',
        peerProvider: true,
        callbackPath: 'auth/auth0-callback',
      },
      $authHooks: {
        generator: '@baseplate/react/auth0/auth0-hooks',
        peerProvider: true,
      },
      $authIdentify: {
        generator: '@baseplate/react/auth/auth-identify',
        peerProvider: true,
      },
      $authApollo: {
        generator: '@baseplate/react/auth0/auth0-apollo',
      },
      $authComponents: {
        generator: '@baseplate/react/auth0/auth0-components',
        loginPath: '/auth/login',
        peerProvider: true,
      },
    };
  }
  return {
    $authService: {
      generator: '@baseplate/react/auth/auth-service',
      peerProvider: true,
    },
    $authHooks: {
      generator: '@baseplate/react/auth/auth-hooks',
      peerProvider: true,
    },
    $authIdentify: {
      generator: '@baseplate/react/auth/auth-identify',
      peerProvider: true,
    },
    $authApollo: {
      generator: '@baseplate/react/auth/auth-apollo',
    },
    $authComponents: {
      generator: '@baseplate/react/auth/auth-components',
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
      generator: '@baseplate/react/core/react-routes',
      children: {
        $auth: {
          generator: '@baseplate/react/auth0/auth0-callback',
        },
      },
    });

    return 'auth/root';
  }

  builder.addDescriptor('auth/root.json', {
    name: 'auth',
    generator: '@baseplate/react/core/react-routes',
    children: {
      $auth: {
        generator: '@baseplate/react/auth/auth-pages',
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
