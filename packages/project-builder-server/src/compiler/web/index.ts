import {
  AppEntry,
  AppUtils,
  ProjectDefinitionContainer,
  WebAppConfig,
} from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder } from '../appEntryBuilder.js';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth.js';

export function buildReact(builder: AppEntryBuilder<WebAppConfig>): unknown {
  const { projectConfig, appConfig } = builder;

  const backendApp = AppUtils.getBackendApp(projectConfig);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  return {
    name: 'react',
    generator: '@halfdomelabs/react/core/react',
    title: appConfig.title,
    description: appConfig.description,
    children: {
      router: {
        children: {
          routes: [
            !builder.appConfig.includeAuth
              ? undefined
              : compileAuthPages(builder, appConfig.allowedRoles),
          ],
        },
      },
      $tailwind: {
        generator: '@halfdomelabs/react/core/react-tailwind',
      },
      proxy: {
        // TODO: Extract out logic
        devBackendHost: `http://localhost:${projectConfig.portOffset + 1}`,
      },
      $sentry: {
        generator: '@halfdomelabs/react/core/react-sentry',
        peerProvider: true,
      },
      $apollo: {
        generator: '@halfdomelabs/react/apollo/react-apollo',
        devApiEndpoint: '/api/graphql',
        schemaLocation: `${backendRelativePath}/schema.graphql`,
        enableSubscriptions: appConfig.enableSubscriptions,
        peerProvider: true,
      },
      $apolloError: {
        generator: '@halfdomelabs/react/apollo/apollo-error',
        peerProvider: true,
      },
      $uploadComponents:
        projectConfig.storage && appConfig.includeUploadComponents
          ? {
              generator: '@halfdomelabs/react/storage/upload-components',
              peerProvider: true,
              fileModelName: builder.nameFromId(
                projectConfig.storage.fileModel,
              ),
            }
          : undefined,
      $datadogLogger: appConfig.enableDatadog
        ? { generator: '@halfdomelabs/react/core/react-datadog' }
        : undefined,
      ...compileAuthFeatures(builder),
    },
  };
}

export function compileWeb(
  definitionContainer: ProjectDefinitionContainer,
  app: WebAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(definitionContainer, app);

  const { projectConfig } = appBuilder;

  const packageName = projectConfig.packageScope
    ? `@${projectConfig.packageScope}/${app.name}`
    : `${projectConfig.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    packageName,
    description: `Web app for ${projectConfig.name}`,
    version: projectConfig.version,
    children: {
      projects: [buildReact(appBuilder)],
    },
  });

  return appBuilder.toProjectEntry();
}
