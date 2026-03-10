import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { groupBy } from 'es-toolkit';

import { storageModuleGenerator } from '#src/generators/fastify/index.js';
import { uploadComponentsGenerator } from '#src/generators/react/upload-components/index.js';

import type { FileTransformerDefinition } from '../transformers/schema/file-transformer.schema.js';
import type { StoragePluginDefinition } from './schema/plugin-definition.js';

import { fileCategoriesGenerator } from './generators/file-categories/file-categories.generator.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      // register backend compilers
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
          const storage = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as StoragePluginDefinition;

          // add feature providers
          appCompiler.addChildrenToFeature(storage.storageFeatureRef, {
            storage: storageModuleGenerator({
              s3Adapters: storage.s3Adapters.map((a) => ({
                name: a.name,
                bucketConfigVar: a.bucketConfigVar,
                hostedUrlConfigVar: a.hostedUrlConfigVar,
              })),
            }),
          });

          // Collect file transformers with resolved categories
          const transformers = projectDefinition.models.flatMap((m) =>
            m.service.transformers
              .filter((t): t is FileTransformerDefinition => t.type === 'file')
              .map((t) => {
                const relation = m.model.relations.find(
                  (r) => r.id === t.fileRelationRef,
                );
                if (!relation) {
                  throw new Error(`File transformer ${t.id} has no relation`);
                }
                const category = storage.fileCategories.find(
                  (c) => c.id === t.categoryRef,
                );
                if (!category) {
                  throw new Error(
                    `File category ${t.categoryRef} not found for transformer ${t.id}`,
                  );
                }
                return { model: m, transformer: t, relation, category };
              }),
          );

          // Build referencedByRelations per category (across all features)
          const relationsByCategory = new Map<string, string[]>();
          for (const t of transformers) {
            const existing = relationsByCategory.get(t.category.name) ?? [];
            existing.push(t.relation.foreignRelationName);
            relationsByCategory.set(t.category.name, existing);
          }

          // Group by feature for generator registration
          const transformersByFeature = groupBy(
            transformers,
            (t) => t.model.featureRef,
          );

          for (const [featureId, featureTransformers] of Object.entries(
            transformersByFeature,
          )) {
            // Dedupe categories within this feature
            const seenCategories = new Set<string>();
            const featureCategories = featureTransformers
              .filter((t) => {
                if (seenCategories.has(t.category.name)) return false;
                seenCategories.add(t.category.name);
                return true;
              })
              .map((t) => ({
                name: t.category.name,
                maxFileSizeMb: t.category.maxFileSizeMb,
                adapter: definitionContainer.nameFromId(t.category.adapterRef),
                authorize: {
                  uploadRoles: t.category.authorize.uploadRoles.map((r) =>
                    definitionContainer.nameFromId(r),
                  ),
                },
                referencedByRelations:
                  relationsByCategory.get(t.category.name) ?? [],
                disableAutoCleanup: t.category.disableAutoCleanup,
              }));

            appCompiler.addChildrenToFeature(featureId, {
              fileCategories: fileCategoriesGenerator({
                featureId,
                fileCategories: featureCategories,
              }),
            });
          }

          // Register standalone categories (disableAutoCleanup with no transformers)
          const standaloneCategories = storage.fileCategories.filter(
            (c) =>
              c.disableAutoCleanup &&
              !transformers.some((t) => t.category.id === c.id),
          );

          if (standaloneCategories.length > 0) {
            appCompiler.addChildrenToFeature(storage.storageFeatureRef, {
              standaloneFileCategories: fileCategoriesGenerator({
                featureId: storage.storageFeatureRef,
                fileCategories: standaloneCategories.map((c) => ({
                  name: c.name,
                  maxFileSizeMb: c.maxFileSizeMb,
                  adapter: definitionContainer.nameFromId(c.adapterRef),
                  authorize: {
                    uploadRoles: c.authorize.uploadRoles.map((r) =>
                      definitionContainer.nameFromId(r),
                    ),
                  },
                  referencedByRelations: [],
                  disableAutoCleanup: true,
                })),
              }),
            });
          }
        },
      }),
      // register web compilers
      pluginAppCompiler({
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler, appDefinition }) => {
          if (
            !appDefinition.includeUploadComponents &&
            !appDefinition.adminApp.enabled
          ) {
            return;
          }

          appCompiler.addRootChildren({
            uploadComponents: uploadComponentsGenerator({}),
          });
        },
      }),
    );
  },
});
