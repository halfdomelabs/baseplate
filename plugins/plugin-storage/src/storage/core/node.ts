import {
  adminAppEntryType,
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import { storageModuleGenerator } from '#src/generators/fastify/index.js';
import { uploadComponentsGenerator } from '#src/generators/react/upload-components/index.js';

import type { StoragePluginDefinition } from './schema/plugin-definition.js';

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
          storage.modelRefs.file,
        );
        appCompiler.addChildrenToFeature(storage.storageFeatureRef, {
          storage: storageModuleGenerator({
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
          }),
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
          uploadComponents: uploadComponentsGenerator({
            fileModelName: definitionContainer.nameFromId(
              storage.modelRefs.file,
            ),
          }),
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
          uploadComponents: uploadComponentsGenerator({
            fileModelName: definitionContainer.nameFromId(
              storage.modelRefs.file,
            ),
          }),
        });
      },
    });

    return {};
  },
});
