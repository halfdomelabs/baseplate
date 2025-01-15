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
  reactDatadogGenerator,
  reactNotFoundHandlerGenerator,
  reactRouterGenerator,
  reactSentryGenerator,
  reactTailwindGenerator,
} from '@halfdomelabs/react-generators';

import { safeMergeAll } from '@src/utils/safe-merge.js';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth.js';

export function buildReact(
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  return composeReactGenerators(
    {
      title: appConfig.title,
      description: appConfig.description,
      children: safeMergeAll(
        {
          reactRouter: reactRouterGenerator({
            children: {
              reactNotFoundHandler: reactNotFoundHandlerGenerator({}),
              auth: builder.appConfig.includeAuth
                ? compileAuthPages(builder, appConfig.allowedRoles)
                : undefined,
            },
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
          reactDatadog: appConfig.enableDatadog
            ? reactDatadogGenerator({})
            : undefined,
        },
        compileAuthFeatures(builder) ?? {},
        appCompiler.getRootChildren(),
      ),
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
      projects: [buildReact(appBuilder)],
    },
  });

  return appBuilder.buildProjectEntry(nodeBundle);
}
