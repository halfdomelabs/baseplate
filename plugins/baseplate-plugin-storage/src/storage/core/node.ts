import {
  FeatureUtils,
  PluginUtils,
  adminAppEntryType,
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  webAppEntryType,
} from '@halfdomelabs/project-builder-lib';

import { StoragePluginDefinition } from './schema/plugin-definition';
import { StorageModuleDescriptor } from '@src/generators/fastify';

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
        const storage = PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
          projectDefinition,
          pluginId,
        );
        const featurePath = FeatureUtils.getFeatureByIdOrThrow(
          projectDefinition,
          storage.featureRef,
        ).name;

        // add feature providers
        const fileModelName = definitionContainer.nameFromId(
          storage.fileModelRef,
        );
        appCompiler.addChildrenToFeature(storage.featureRef, {
          $storage: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/fastify/storage-module',
            fileObjectTypeRef: `${featurePath}/root:$schemaTypes.${fileModelName}ObjectType.$objectType`,
            fileModel: fileModelName,
            s3Adapters: storage.s3Adapters.map((a) => ({
              name: a.name,
              bucketConfigVar: a.bucketConfigVar,
              hostedUrlConfigVar: a.hostedUrlConfigVar,
            })),
            categories: storage.categories.map((c) => ({
              ...c,
              usedByRelation: definitionContainer.nameFromId(c.usedByRelation),
              defaultAdapter: definitionContainer.nameFromId(c.defaultAdapter),
              uploadRoles: c.uploadRoles.map((r) =>
                definitionContainer.nameFromId(r),
              ),
            })),
          } satisfies StorageModuleDescriptor,
        });

        appCompiler.addGlobalHoistedProviders('storage-module');
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
        const storage = PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
          projectDefinition,
          pluginId,
        );

        appCompiler.addRootChildren({
          $uploadComponents: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/react/upload-components',
            peerProvider: true,
            fileModelName: definitionContainer.nameFromId(storage.fileModelRef),
          },
        });
      },
    });

    appCompiler.registerAppCompiler({
      pluginId,
      appType: adminAppEntryType,
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const storage = PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
          projectDefinition,
          pluginId,
        );

        appCompiler.addRootChildren({
          $uploadComponents: {
            generator:
              '@halfdomelabs/baseplate-plugin-storage/react/upload-components',
            peerProvider: true,
            fileModelName: definitionContainer.nameFromId(storage.fileModelRef),
          },
        });
      },
    });

    return {};
  },
});
