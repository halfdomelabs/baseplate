import type {
  AdminAppConfig,
  AppEntry,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';
import type { AdminLayoutLinkItem } from '@halfdomelabs/react-generators';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import { composeNodeGenerator } from '@halfdomelabs/core-generators';
import {
  adminAppEntryType,
  AppUtils,
  FeatureUtils,
} from '@halfdomelabs/project-builder-lib';
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
  reactNotFoundHandlerGenerator,
  reactRouterGenerator,
  reactSentryGenerator,
  reactTailwindGenerator,
} from '@halfdomelabs/react-generators';
import { capitalize } from 'inflection';

import { notEmpty } from '@src/utils/array.js';
import { dasherizeCamel, titleizeCamel } from '@src/utils/case.js';

import type { AdminAppEntryBuilder } from '../app-entry-builder.js';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth.js';
import { compileAdminFeatures } from './sections.js';

export function buildNavigationLinks(
  builder: AppEntryBuilder<AdminAppConfig>,
): AdminLayoutLinkItem[] {
  const config = builder.appConfig;
  const { projectDefinition } = builder;
  return (
    config.sections?.map((section) => ({
      type: 'link',
      label: titleizeCamel(section.name),
      icon: section.icon ?? 'MdHome',
      path: `${
        FeatureUtils.getFeatureByIdOrThrow(
          projectDefinition,
          section.featureRef,
        ).name
      }/${dasherizeCamel(section.name)}`,
    })) ?? []
  );
}

export function buildAdmin(builder: AdminAppEntryBuilder): GeneratorBundle {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  return composeReactGenerators(
    {
      title: `${capitalize(projectDefinition.name)} Admin Dashboard`,
      children: {
        reactRouter: reactRouterGenerator({
          children: {
            reactNotFoundHandler: reactNotFoundHandlerGenerator({}),
            routes: [
              compileAuthPages(builder, appConfig.allowedRoles),
              adminHomeGenerator({}),
              ...compileAdminFeatures(builder),
              ...(backendApp.enableBullQueue
                ? [
                    adminBullBoardGenerator({
                      bullBoardUrl: `http://localhost:${
                        projectDefinition.portOffset + 1
                      }`,
                    }),
                  ]
                : []),
            ].filter(notEmpty),
          },
        }),
        reactComponents: reactComponentsGenerator({
          includeDatePicker: true,
        }),
        reactTailwind: reactTailwindGenerator({}),
        reactSentry: reactSentryGenerator({}),
        reactApollo: reactApolloGenerator({
          devApiEndpoint: '/api/graphql',
          schemaLocation: `${backendRelativePath}/schema.graphql`,
          children: {
            apolloErrorLink: apolloErrorLinkGenerator({}),
            apolloSentry: apolloSentryGenerator({}),
          },
        }),
        apolloError: apolloErrorGenerator({}),
        adminLayout: adminLayoutGenerator({
          links: [
            { type: 'link', label: 'Home', icon: 'MdHome', path: '/' },
            ...buildNavigationLinks(builder),
            ...(backendApp.enableBullQueue
              ? [
                  {
                    type: 'link' as const,
                    label: 'Queues',
                    icon: 'AiOutlineOrderedList',
                    path: '/bull-board',
                  },
                ]
              : []),
          ],
        }),
        adminComponents: adminComponentsGenerator({}),
        ...compileAuthFeatures(builder),
        ...appCompiler.getRootChildren(),
      },
    },
    {
      // TODO: Extract out logic
      devBackendHost: `http://localhost:${projectDefinition.portOffset + 1}`,
    },
  );
}

export function compileAdmin(
  definitionContainer: ProjectDefinitionContainer,
  app: AdminAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(
    definitionContainer,
    app,
    adminAppEntryType,
  );

  const { projectDefinition } = appBuilder;

  const packageName = projectDefinition.packageScope
    ? `@${projectDefinition.packageScope}/${app.name}`
    : `${projectDefinition.name}-${app.name}`;

  const nodeBundle = composeNodeGenerator({
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Admin web app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    children: {
      projects: [buildAdmin(appBuilder)],
    },
  });

  return appBuilder.buildProjectEntry(nodeBundle);
}
