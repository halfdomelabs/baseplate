import {
  adminAppEntryType,
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@halfdomelabs/project-builder-lib';

import type { StorageModuleDescriptor } from '@src/generators/fastify';

import type { StoragePluginDefinition } from './schema/plugin-definition';

export default createPlatformPluginExport({
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  exports: {},
  initialize: ({ appCompiler }, { pluginId }) => {
    // register backend compilers
    appCompiler.registerAppCompiler({
      pluginId,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const storage = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as StoragePluginDefinition;

        // add feature providers
        const fileModelName = definitionContainer.nameFromId(
          storage.fileModelRef,
        );
        appCompiler.addChildrenToFeature(storage.featureRef, {
          $storage: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/fastify/storage-module',
            fileModel: fileModelName,
            s3Adapters: storage.s3Adapters.map((a) => ({
              name: a.name,
              bucketConfigVar: a.bucketConfigVar,
              hostedUrlConfigVar: a.hostedUrlConfigVar,
            })),
            categories: storage.categories.map((c) => ({
              name: c.name,
              maxFileSize: c.maxFileSize,
              usedByRelation: definitionContainer.nameFromId(
                c.usedByRelationRef,
              ),
              defaultAdapter: definitionContainer.nameFromId(
                c.defaultAdapterRef,
              ),
              uploadRoles: c.uploadRoles.map((r) =>
                definitionContainer.nameFromId(r),
              ),
            })),
          } satisfies StorageModuleDescriptor,
        });
      },
    });

    // register web compilers
    appCompiler.registerAppCompiler({
      pluginId,
      appType: webAppEntryType,
      compile: ({
        projectDefinition,
        definitionContainer,
        appCompiler,
        appDefinition,
      }) => {
        if (!appDefinition.includeUploadComponents) {
          return;
        }
        const storage = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as StoragePluginDefinition;

        appCompiler.addRootChildren({
          $uploadComponents: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/react/upload-components',
            fileModelName: definitionContainer.nameFromId(storage.fileModelRef),
          },
        });
      },
    });

    appCompiler.registerAppCompiler({
      pluginId,
      appType: adminAppEntryType,
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const storage = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as StoragePluginDefinition;

        appCompiler.addRootChildren({
          $uploadComponents: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/react/upload-components',
            fileModelName: definitionContainer.nameFromId(storage.fileModelRef),
          },
        });
      },
    });

    return {};
  },
});
