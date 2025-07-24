import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { groupBy } from 'es-toolkit';

import { storageModuleGenerator } from '#src/generators/fastify/index.js';
import { uploadComponentsGenerator } from '#src/generators/react/upload-components/index.js';

import type { FileTransformerDefinition } from '../transformers/schema/file-transformer.schema.js';
import type { StoragePluginDefinition } from './schema/plugin-definition.js';

import { fileCategoriesGenerator } from './generators/file-categories/file-categories.generator.js';

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
          }),
        });

        // Add file categories
        const transformers = projectDefinition.models.flatMap((m) =>
          m.service.transformers
            .filter((m): m is FileTransformerDefinition => m.type === 'file')
            .map((t) => {
              const relation = m.model.relations?.find(
                (r) => r.id === t.fileRelationRef,
              );
              if (!relation) {
                throw new Error(`File transformer ${t.id} has no relation`);
              }
              return {
                model: m,
                transformer: t,
                relation,
              };
            }),
        );

        const transformersByFeature = groupBy(
          transformers,
          (t) => t.model.featureRef,
        );

        for (const [featureId, transformers] of Object.entries(
          transformersByFeature,
        )) {
          appCompiler.addChildrenToFeature(featureId, {
            fileCategories: fileCategoriesGenerator({
              featureId,
              fileCategories: transformers.map((t) => ({
                name: t.transformer.category.name,
                maxFileSizeMb: t.transformer.category.maxFileSizeMb,
                adapter: definitionContainer.nameFromId(
                  t.transformer.category.adapterRef,
                ),
                authorize: {
                  uploadRoles: t.transformer.category.authorize.uploadRoles.map(
                    (r) => definitionContainer.nameFromId(r),
                  ),
                },
                referencedByRelation: t.relation.foreignRelationName,
              })),
            }),
          });
        }
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
        if (
          !appDefinition.includeUploadComponents &&
          !appDefinition.adminApp?.enabled
        ) {
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

    return {};
  },
});
