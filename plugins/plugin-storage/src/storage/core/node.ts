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
import { getStorageWebAppData } from './schema/web-app-schema.js';

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

          // add feature providers (only when file categories are configured,
          // since nearly all storage module templates depend on categories)
          if (storage.fileCategories.length > 0) {
            appCompiler.addChildrenToFeature(storage.storageFeatureRef, {
              storage: storageModuleGenerator({
                s3Adapters: storage.s3Adapters.map((a) => ({
                  name: a.name,
                  bucketConfigVar: a.bucketConfigVar,
                  hostedUrlConfigVar: a.hostedUrlConfigVar,
                })),
              }),
            });
          }

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

          // Aggregated across all features, matching referencedByRelations.
          const referencedByCategory = new Map<
            string,
            {
              relationName: string;
              modelName: string;
              fieldName: string;
              foreignKeyFieldName: string;
              fieldRoles?: { globalRoles: string[]; instanceRoles: string[] };
            }[]
          >();
          for (const t of transformers) {
            // Absent when the relation isn't exposed in GraphQL. Left undefined
            // rather than empty so the generator can tell "no gate to mirror"
            // (→ no read rule) from "exposed with no roles" (→ ungated read).
            const exposedRelation =
              t.model.graphql.objectType.localRelations.find(
                (r) => r.ref === t.transformer.fileRelationRef,
              );
            // The FK column backing the relation, e.g. `avatarId`. Read from the
            // relation rather than derived from its name, which need not match.
            const firstReference = t.relation.references[0];
            if (!firstReference) {
              throw new Error(
                `Relation ${t.relation.name} on model ${t.model.name} has no references`,
              );
            }
            const foreignKeyFieldName = definitionContainer.nameFromId(
              firstReference.localRef,
            );
            const existing = referencedByCategory.get(t.category.name) ?? [];
            existing.push({
              relationName: t.relation.foreignRelationName,
              modelName: t.model.name,
              fieldName: t.relation.name,
              foreignKeyFieldName,
              fieldRoles: exposedRelation && {
                globalRoles: exposedRelation.globalRoles.map((r) =>
                  definitionContainer.nameFromId(r),
                ),
                instanceRoles: exposedRelation.instanceRoles.map((r) =>
                  definitionContainer.nameFromId(r),
                ),
              },
            });
            referencedByCategory.set(t.category.name, existing);
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
                allowedMimeTypes: t.category.allowedMimeTypes,
                adapter: definitionContainer.nameFromId(t.category.adapterRef),
                authorize: {
                  uploadRoles: t.category.authorize.uploadRoles.map((r) =>
                    definitionContainer.nameFromId(r),
                  ),
                },
                referencedBy: referencedByCategory.get(t.category.name) ?? [],
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
                  allowedMimeTypes: c.allowedMimeTypes,
                  adapter: definitionContainer.nameFromId(c.adapterRef),
                  authorize: {
                    uploadRoles: c.authorize.uploadRoles.map((r) =>
                      definitionContainer.nameFromId(r),
                    ),
                  },
                  referencedBy: [],
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
        compile: ({ appCompiler, appDefinition, projectDefinition }) => {
          const webStorage = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as StoragePluginDefinition;

          if (webStorage.fileCategories.length === 0) {
            return;
          }

          const includeUploadComponents =
            getStorageWebAppData(appDefinition, pluginKey)
              ?.includeUploadComponents ?? false;
          if (!includeUploadComponents && !appDefinition.adminApp.enabled) {
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
