import { relative } from 'path-browserify';
import { ProjectConfig, WebAppConfig } from '@src/schema';
import { AppEntry } from '@src/types/files';
import { AppEntryBuilder } from '../appEntryBuilder';
import { compileAuthPages } from './auth';

export function buildReact(builder: AppEntryBuilder<WebAppConfig>): unknown {
  const { projectConfig, appConfig } = builder;

  const backendApps = projectConfig.apps.filter((a) => a.type === 'backend');

  if (backendApps.length > 1 || !backendApps.length) {
    throw new Error(`Only one backend app is supported and must exist`);
  }

  const backendApp = backendApps[0];

  // TODO: Extract out logic
  const backendRelativePath = relative(
    appConfig.packageLocation || `packages/${appConfig.name}`,
    backendApp.packageLocation || `packages/${backendApp.name}`
  );

  return {
    name: 'react',
    generator: '@baseplate/react/core/react',
    title: appConfig.title,
    description: appConfig.description,
    children: {
      router: {
        children: {
          routes: [compileAuthPages(builder)],
        },
      },

      $tailwind: {
        generator: '@baseplate/react/core/react-tailwind',
      },
      proxy: {
        // TODO: Extract out logic
        devBackendHost: `http://localhost:${projectConfig.portBase + 1}`,
      },
      $sentry: {
        generator: '@baseplate/react/core/react-sentry',
      },
      $apollo: {
        generator: '@baseplate/react/apollo/react-apollo',
        devApiEndpoint: '/api/graphql',
        schemaLocation: `${backendRelativePath}/schema.graphql`,
        peerProvider: true,
      },
      $apolloError: {
        generator: '@baseplate/react/apollo/apollo-error',
        peerProvider: true,
      },
      ...(appConfig.includeAuth
        ? {
            $authService: {
              generator: '@baseplate/react/auth/auth-service',
              peerProvider: true,
            },
            $authHooks: {
              generator: '@baseplate/react/auth/auth-hooks',
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
          }
        : {}),
    },
  };
}

export function compileWeb(
  projectConfig: ProjectConfig,
  app: WebAppConfig
): AppEntry {
  const appBuilder = new AppEntryBuilder(projectConfig, app);

  appBuilder.addDescriptor('root.json', {
    generator: '@baseplate/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    description: `Web app for ${projectConfig.name}`,
    version: projectConfig.version,
    children: {
      projects: [buildReact(appBuilder)],
    },
  });

  return appBuilder.toProjectEntry();
}
