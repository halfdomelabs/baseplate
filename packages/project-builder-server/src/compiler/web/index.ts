import type {
  AppEntry,
  ProjectDefinitionContainer,
  WebAppConfig,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import { composeNodeGenerator } from '@halfdomelabs/core-generators';
import { AppUtils, webAppEntryType } from '@halfdomelabs/project-builder-lib';
import {
  apolloErrorGenerator,
  apolloErrorLinkGenerator,
  apolloSentryGenerator,
  composeReactGenerators,
  reactApolloGenerator,
  reactNotFoundHandlerGenerator,
  reactRouterGenerator,
  reactSentryGenerator,
  reactTailwindGenerator,
} from '@halfdomelabs/react-generators';
import { safeMerge } from '@halfdomelabs/utils';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { compileWebFeatures } from './features.js';

function buildReact(builder: AppEntryBuilder<WebAppConfig>): GeneratorBundle {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  const rootFeatures = appCompiler.getRootChildren();

  return composeReactGenerators(
    {
      title: appConfig.title,
      description: appConfig.description,
      children: {
        reactRouter: reactRouterGenerator({
          children: safeMerge(
            {
              reactNotFoundHandler: reactNotFoundHandlerGenerator({}),
              features: compileWebFeatures(builder),
            },
            rootFeatures,
          ),
        }),
        reactTailwind: reactTailwindGenerator({}),
        reactSentry: reactSentryGenerator({}),
        reactApollo: reactApolloGenerator({
          devApiEndpoint: '/api/graphql',
          schemaLocation: `${backendRelativePath}/schema.graphql`,
          enableSubscriptions: appConfig.enableSubscriptions,
          children: {
            apolloErrorLink: apolloErrorLinkGenerator({}),
            apolloSentry: apolloSentryGenerator({}),
          },
        }),
        apolloError: apolloErrorGenerator({}),
      },
    },
    {
      // TODO: Extract out logic
      devBackendHost: `http://localhost:${projectDefinition.portOffset + 1}`,
    },
  );
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

  const nodeBundle = composeNodeGenerator({
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Web app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    children: {
      react: buildReact(appBuilder),
    },
  });

  return appBuilder.buildProjectEntry(nodeBundle);
}
