import path from 'path';
import { capitalize } from 'inflection';
import { AdminAppConfig } from '@src/schema/apps/admin/index.js';
import { BackendAppConfig, ProjectConfig } from '@src/schema/index.js';
import { AppEntry } from '@src/types/files.js';
import { dasherizeCamel, titleizeCamel } from '@src/utils/case.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth.js';
import { compileAdminFeatures } from './sections.js';

export function buildNavigationLinks(config: AdminAppConfig): unknown[] {
  return (
    config.sections?.map((section) => ({
      type: 'link',
      label: titleizeCamel(section.name),
      icon: section.icon || 'MdHome',
      path: `${section.feature}/${dasherizeCamel(section.name)}`,
    })) || []
  );
}

export function buildAdmin(builder: AppEntryBuilder<AdminAppConfig>): unknown {
  const { projectConfig, appConfig } = builder;

  const backendApps = projectConfig.apps.filter(
    (a): a is BackendAppConfig => a.type === 'backend'
  );

  if (backendApps.length > 1 || !backendApps.length) {
    throw new Error(`Only one backend app is supported and must exist`);
  }

  const backendApp = backendApps[0];

  // TODO: Extract out logic
  const backendRelativePath = path.relative(
    appConfig.packageLocation || `packages/${appConfig.name}`,
    backendApp.packageLocation || `packages/${backendApp.name}`
  );

  return {
    name: 'react',
    generator: '@halfdomelabs/react/core/react',
    title: `${capitalize(projectConfig.name)} Admin Dashboard`,
    children: {
      router: {
        children: {
          routes: [
            compileAuthPages(builder, appConfig.allowedRoles),
            {
              name: 'home',
              generator: '@halfdomelabs/react/admin/admin-home',
            },
            ...compileAdminFeatures(builder),
            ...(backendApp.enableBullQueue
              ? [
                  {
                    name: 'bull-board',
                    generator: '@halfdomelabs/react/admin/admin-bull-board',
                    bullBoardUrl: `http://localhost:${
                      projectConfig.portOffset + 1
                    }`,
                  },
                ]
              : []),
          ],
        },
      },
      components: {
        includeDatePicker: true,
      },
      $tailwind: {
        generator: '@halfdomelabs/react/core/react-tailwind',
        peerProvider: true,
      },
      proxy: {
        // TODO: Extract out logic
        devBackendHost: `http://localhost:${projectConfig.portOffset + 1}`,
      },
      $adminLayout: {
        generator: '@halfdomelabs/react/admin/admin-layout',
        links: [
          { type: 'link', label: 'Home', icon: 'MdHome', path: '/' },
          ...buildNavigationLinks(appConfig),
          ...(backendApp.enableBullQueue
            ? [
                {
                  type: 'link',
                  label: 'Queues',
                  icon: 'AiOutlineOrderedList',
                  path: '/bull-board',
                },
              ]
            : []),
        ],
      },
      $adminComponents: {
        generator: '@halfdomelabs/react/admin/admin-components',
        peerProvider: true,
      },
      $sentry: {
        generator: '@halfdomelabs/react/core/react-sentry',
      },
      $apollo: {
        generator: '@halfdomelabs/react/apollo/react-apollo',
        devApiEndpoint: '/api/graphql',
        schemaLocation: `${backendRelativePath}/schema.graphql`,
        peerProvider: true,
      },
      $apolloError: {
        generator: '@halfdomelabs/react/apollo/apollo-error',
        peerProvider: true,
      },
      $uploadComponents: projectConfig.storage
        ? {
            generator: '@halfdomelabs/react/storage/upload-components',
            peerProvider: true,
            fileModelName: projectConfig.storage.fileModel,
          }
        : undefined,
      ...compileAuthFeatures(builder),
    },
  };
}

export function compileAdmin(
  projectConfig: ProjectConfig,
  app: AdminAppConfig
): AppEntry {
  const appBuilder = new AppEntryBuilder(projectConfig, app);

  const packageName = projectConfig.packageScope
    ? `@${projectConfig.packageScope}/${app.name}`
    : `${projectConfig.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    packageName,
    description: `Admin web app for ${projectConfig.name}`,
    version: projectConfig.version,
    children: {
      projects: [buildAdmin(appBuilder)],
    },
  });

  return appBuilder.toProjectEntry();
}
