import { capitalize } from 'inflection';
import { relative } from 'path-browserify';
import { BackendAppConfig, ProjectConfig } from '@src/schema';
import { AdminAppConfig } from '@src/schema/apps/admin';
import { AppEntry } from '@src/types/files';
import { dasherizeCamel, titleizeCamel } from '@src/utils/case';
import { AppEntryBuilder } from '../appEntryBuilder';
import { compileAuthFeatures, compileAuthPages } from '../lib/web-auth';
import { compileAdminFeatures } from './sections';

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
  const backendRelativePath = relative(
    appConfig.packageLocation || `packages/${appConfig.name}`,
    backendApp.packageLocation || `packages/${backendApp.name}`
  );

  return {
    name: 'react',
    generator: '@baseplate/react/core/react',
    title: `${capitalize(projectConfig.name)} Admin Dashboard`,
    children: {
      router: {
        children: {
          routes: [
            compileAuthPages(builder, appConfig.allowedRoles),
            {
              name: 'home',
              generator: '@baseplate/react/admin/admin-home',
            },
            ...compileAdminFeatures(builder),
            ...(backendApp.enableBullQueue
              ? [
                  {
                    name: 'bull-board',
                    generator: '@baseplate/react/admin/admin-bull-board',
                    bullBoardUrl: `http://localhost:${
                      projectConfig.portBase + 1
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
        generator: '@baseplate/react/core/react-tailwind',
      },
      proxy: {
        // TODO: Extract out logic
        devBackendHost: `http://localhost:${projectConfig.portBase + 1}`,
      },
      $adminLayout: {
        generator: '@baseplate/react/admin/admin-layout',
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
        generator: '@baseplate/react/admin/admin-components',
        peerProvider: true,
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
      $uploadComponents: projectConfig.storage
        ? {
            generator: '@baseplate/react/storage/upload-components',
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

  appBuilder.addDescriptor('root.json', {
    generator: '@baseplate/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    description: `Admin web app for ${projectConfig.name}`,
    version: projectConfig.version,
    children: {
      projects: [buildAdmin(appBuilder)],
    },
  });

  return appBuilder.toProjectEntry();
}
