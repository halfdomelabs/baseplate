import type {
  AppEntry,
  ProjectDefinitionContainer,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { AdminLayoutLinkItem } from '@baseplate-dev/react-generators';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { composeNodeGenerator } from '@baseplate-dev/core-generators';
import {
  AppUtils,
  FeatureUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import {
  adminBullBoardGenerator,
  adminComponentsGenerator,
  adminHomeGenerator,
  adminLayoutGenerator,
  apolloErrorGenerator,
  apolloErrorLinkGenerator,
  apolloSentryGenerator,
  composeReactGenerators,
  reactApolloGenerator,
  reactComponentsGenerator,
  reactRouterGenerator,
  reactRoutesGenerator,
  reactSentryGenerator,
  reactTailwindGenerator,
} from '@baseplate-dev/react-generators';
import { safeMerge } from '@baseplate-dev/utils';
import { kebabCase } from 'es-toolkit';

import { titleizeCamel } from '#src/utils/case.js';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { compileAdminSections } from './admin/index.js';
import { compileWebFeatures } from './features.js';

function buildAdminNavigationLinks(
  builder: AppEntryBuilder<WebAppConfig>,
): AdminLayoutLinkItem[] {
  const { adminApp } = builder.appConfig;
  const { projectDefinition } = builder;

  if (!adminApp?.enabled || !adminApp.sections) {
    return [];
  }

  return adminApp.sections.map((section) => ({
    type: 'link',
    label: titleizeCamel(section.name),
    icon: section.icon ?? 'MdHome',
    path: `${adminApp.pathPrefix}/${
      FeatureUtils.getFeatureByIdOrThrow(projectDefinition, section.featureRef)
        .name
    }/${kebabCase(section.name)}`,
  }));
}

function buildAdminRoutes(
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle | undefined {
  const { adminApp } = builder.appConfig;
  const { projectDefinition, definitionContainer } = builder;

  if (!adminApp?.enabled) {
    return undefined;
  }

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const generalSettings = projectDefinition.settings.general;

  return reactRoutesGenerator({
    name: 'admin',
    children: {
      adminLayout: adminLayoutGenerator({
        links: [
          {
            type: 'link',
            label: 'Home',
            icon: 'MdHome',
            path: adminApp.pathPrefix,
          },
          ...buildAdminNavigationLinks(builder),
          ...(backendApp.enableBullQueue
            ? [
                {
                  type: 'link' as const,
                  label: 'Queues',
                  icon: 'AiOutlineOrderedList',
                  path: `${adminApp.pathPrefix}/bull-board`,
                },
              ]
            : []),
        ],
        requiredRoles:
          adminApp.allowedRoles?.map((roleId) =>
            definitionContainer.nameFromId(roleId),
          ) ?? [],
      }),
      admin: adminHomeGenerator({}),
      adminRoutes: backendApp.enableBullQueue
        ? adminBullBoardGenerator({
            bullBoardUrl: `http://localhost:${generalSettings.portOffset + 1}`,
          })
        : undefined,
      routes: compileAdminSections(builder),
    },
  });
}

function buildReact(builder: AppEntryBuilder<WebAppConfig>): GeneratorBundle {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  const rootFeatures = appCompiler.getRootChildren();
  const adminRoutes = buildAdminRoutes(builder);

  const routerChildren = safeMerge(
    {
      features: compileWebFeatures(builder),
      ...(adminRoutes ? { adminRoute: adminRoutes } : {}),
    },
    rootFeatures,
  );

  return composeReactGenerators(
    {
      title: appConfig.title,
      description: appConfig.description,
      children: {
        reactRouter: reactRouterGenerator({
          children: routerChildren,
          renderPlaceholderIndex: adminRoutes ? false : true,
        }),
        reactComponents: reactComponentsGenerator({}),
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
        ...(appConfig.adminApp?.enabled
          ? { adminComponents: adminComponentsGenerator({}) }
          : {}),
      },
    },
    {
      // TODO: Extract out logic
      devBackendHost: `http://localhost:${projectDefinition.settings.general.portOffset + 1}`,
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

  const generalSettings = projectDefinition.settings.general;

  const packageName = generalSettings.packageScope
    ? `@${generalSettings.packageScope}/${app.name}`
    : `${generalSettings.name}-${app.name}`;

  const nodeBundle = composeNodeGenerator({
    name: `${generalSettings.name}-${app.name}`,
    packageName,
    description: `Web app for ${generalSettings.name}`,
    version: '1.0.0',
    children: {
      react: buildReact(appBuilder),
    },
  });

  return appBuilder.buildProjectEntry(nodeBundle);
}
