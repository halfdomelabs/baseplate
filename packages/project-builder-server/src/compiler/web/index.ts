import {
  AppEntry,
  AppUtils,
  ProjectDefinitionContainer,
  WebAppConfig,
  webAppEntryType,
} from '@halfdomelabs/project-builder-lib';

import { NodeGeneratorDescriptor } from '../../../../core-generators/dist/index.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth.js';

export function buildReact(builder: AppEntryBuilder<WebAppConfig>): unknown {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
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
        devBackendHost: `http://localhost:${projectDefinition.portOffset + 1}`,
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
      $datadogLogger: appConfig.enableDatadog
        ? { generator: '@halfdomelabs/react/core/react-datadog' }
        : undefined,
      ...compileAuthFeatures(builder),
      ...appCompiler.getRootChildren(),
    },
  };
}

export function compileWeb(
  definitionContainer: ProjectDefinitionContainer,
  app: WebAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(
    definitionContainer,
    app,
    webAppEntryType,
  );

  const { projectDefinition } = appBuilder;

  const packageName = projectDefinition.packageScope
    ? `@${projectDefinition.packageScope}/${app.name}`
    : `${projectDefinition.name}-${app.name}`;

  appBuilder.addDescriptor<NodeGeneratorDescriptor>('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Web app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    children: {
      projects: [buildReact(appBuilder)],
    },
  });

  return appBuilder.toProjectEntry();
}
