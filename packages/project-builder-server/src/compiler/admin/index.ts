import type {
  AdminAppConfig,
  AppEntry,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type { AdminLayoutLinkItem } from '@baseplate-dev/react-generators';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { composeNodeGenerator } from '@baseplate-dev/core-generators';
import {
  adminAppEntryType,
  AppUtils,
  FeatureUtils,
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
  reactNotFoundHandlerGenerator,
  reactRouterGenerator,
  reactRoutesGenerator,
  reactSentryGenerator,
  reactTailwindGenerator,
} from '@baseplate-dev/react-generators';
import { safeMerge } from '@baseplate-dev/utils';
import { capitalize } from 'inflection';

import { dasherizeCamel, titleizeCamel } from '#src/utils/case.js';

import type { AdminAppEntryBuilder } from '../app-entry-builder.js';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { compileAdminFeatures } from './sections.js';

function buildNavigationLinks(
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

function buildAdmin(builder: AdminAppEntryBuilder): GeneratorBundle {
  const { projectDefinition, appConfig, appCompiler } = builder;

  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const backendRelativePath = AppUtils.getBackendRelativePath(
    appConfig,
    backendApp,
  );

  const rootFeatures = appCompiler.getRootChildren();
  const generalSettings = projectDefinition.settings.general;

  return composeReactGenerators(
    {
      title: `${capitalize(generalSettings.name)} Admin Dashboard`,
      children: {
        reactRouter: reactRouterGenerator({
          children: safeMerge(
            {
              adminRoute: reactRoutesGenerator({
                id: 'admin',
                name: '_admin',
                children: {
                  adminLayout: adminLayoutGenerator({
                    links: [
                      {
                        type: 'link',
                        label: 'Home',
                        icon: 'MdHome',
                        path: '/',
                      },
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
                  reactNotFoundHandler: reactNotFoundHandlerGenerator({}),
                  admin: adminHomeGenerator({}),
                  adminRoutes: backendApp.enableBullQueue
                    ? adminBullBoardGenerator({
                        bullBoardUrl: `http://localhost:${
                          generalSettings.portOffset + 1
                        }`,
                      })
                    : undefined,
                  routes: compileAdminFeatures(builder),
                },
              }),
            },
            rootFeatures,
          ),
        }),
        reactComponents: reactComponentsGenerator({}),
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
        adminComponents: adminComponentsGenerator({}),
      },
    },
    {
      // TODO: Extract out logic
      devBackendHost: `http://localhost:${generalSettings.portOffset + 1}`,
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

  const generalSettings = projectDefinition.settings.general;

  const packageName = generalSettings.packageScope
    ? `@${generalSettings.packageScope}/${app.name}`
    : `${generalSettings.name}-${app.name}`;

  const nodeBundle = composeNodeGenerator({
    name: `${generalSettings.name}-${app.name}`,
    packageName,
    description: `Admin web app for ${generalSettings.name}`,
    version: '1.0.0',
    children: {
      admin: buildAdmin(appBuilder),
    },
  });

  return appBuilder.buildProjectEntry(nodeBundle);
}
