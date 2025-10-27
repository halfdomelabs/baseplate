import type { WebAppConfig } from '@baseplate-dev/project-builder-lib';
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

import type { AppEntryBuilder } from '../app-entry-builder.js';
import type { PackageTasks } from '../package-compiler.js';
import type { PackageEntry } from '../package-entry.js';

import { AppCompiler } from '../app-compiler.js';
import { createAppEntryBuilderForPackage } from '../package-compiler.js';
import { compileAdminSections } from './admin/index.js';
import { compileWebFeatures } from './features.js';

/**
 * Build navigation links for admin panel sidebar
 *
 * Creates links for each admin section based on feature references
 */
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

/**
 * Build admin routes generator if admin panel is enabled
 *
 * Includes admin layout, home page, and optional Bull Board integration
 */
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

/**
 * Build React application generator bundle
 *
 * Combines React Router, Apollo Client, Tailwind, Sentry, and admin panel
 */
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
      devBackendHost: `http://localhost:${projectDefinition.settings.general.portOffset + 1}`,
    },
  );
}

/**
 * Compiler for web packages
 *
 * Generates a React-based web application with:
 * - React Router for client-side routing
 * - Apollo Client for GraphQL queries
 * - Tailwind CSS for styling
 * - Optional admin panel with CRUD sections
 * - Plugin-contributed generators (auth, storage, etc.)
 */
export class WebPackageCompiler extends AppCompiler<WebAppConfig> {
  compile(): PackageEntry {
    const appBuilder = createAppEntryBuilderForPackage(
      this.definitionContainer,
      this.appConfig,
      webAppEntryType,
    );

    const { projectDefinition } = appBuilder;
    const generalSettings = projectDefinition.settings.general;

    const nodeBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${this.appConfig.name}`,
      packageName: this.getPackageName(),
      description: `Web app for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        react: buildReact(appBuilder),
      },
    });

    return appBuilder.buildProjectEntry(nodeBundle, this.getPackageDirectory());
  }

  getTasks(): PackageTasks {
    return {
      build: ['build'],
      dev: ['dev', 'watch:gql'],
      watch: ['watch:gql'],
    };
  }
}
