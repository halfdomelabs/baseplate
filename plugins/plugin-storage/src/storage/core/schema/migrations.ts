import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import { modelTransformerEntityType } from '@baseplate-dev/project-builder-lib';
import { constantCase } from 'es-toolkit';

import { fileCategoryEntityType } from './plugin-definition.js';

export const STORAGE_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'move-file-model',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as {
        fileModelRef: string;
        featureRef: string;
      };
      return {
        updatedConfig: {
          ...typedConfig,
          storageFeatureRef: typedConfig.featureRef,
          fileModelRef: undefined,
          featureRef: undefined,
          modelRefs: {
            file: typedConfig.fileModelRef,
          },
        },
      };
    },
  },
  {
    name: 'move-categories-to-transformers',
    version: 2,
    migrate: (config) => {
      interface OldCategory {
        name: string;
        defaultAdapterRef: string;
        maxFileSize: number;
        usedByRelationRef: string;
        uploadRoles: string[];
      }

      interface ProjectDefinitionConfig {
        models: {
          name: string;
          model: {
            relations?: {
              name: string;
              foreignRelationName: string;
              foreignId: string;
              modelRef: string;
            }[];
          };
          service?: {
            transformers?: {
              id: string;
              type: string;
              fileRelationRef: string;
              category?: {
                name: string;
                maxFileSizeMb: number;
                authorize: {
                  uploadRoles: string[];
                };
                adapterRef: string;
              };
            }[];
          };
        }[];
      }

      const typedConfig = config as {
        modelRefs: {
          file: string;
        };
        categories: OldCategory[];
      };

      return {
        updatedConfig: {
          ...typedConfig,
          categories: undefined,
        },
        updateProjectDefinition: (draft: unknown) => {
          const typedProjectDefinition = draft as ProjectDefinitionConfig;

          const fileModel = typedProjectDefinition.models.find(
            (model) => model.name === typedConfig.modelRefs.file,
          );
          if (!fileModel) {
            throw new Error(
              `Could not find file model ${typedConfig.modelRefs.file}`,
            );
          }

          for (const category of typedConfig.categories) {
            // Find matching relation
            const model = typedProjectDefinition.models.find((model) =>
              model.model.relations?.some(
                (relation) =>
                  relation.foreignRelationName === category.usedByRelationRef &&
                  relation.modelRef === fileModel.name,
              ),
            );
            if (!model) {
              throw new Error(
                `Could not find model for category ${category.name}`,
              );
            }
            const relation = model.model.relations?.find(
              (relation) =>
                relation.foreignRelationName === category.usedByRelationRef &&
                relation.modelRef === fileModel.name,
            );
            if (!relation) {
              throw new Error(
                `Could not find relation for category ${category.name}`,
              );
            }
            const transformer = model.service?.transformers?.find(
              (transformer) => transformer.fileRelationRef === relation.name,
            );
            if (transformer) {
              transformer.category = {
                name: constantCase(category.name),
                maxFileSizeMb: category.maxFileSize,
                authorize: {
                  uploadRoles: category.uploadRoles,
                },
                adapterRef: category.defaultAdapterRef,
              };
            } else {
              model.service = {
                ...model.service,
                transformers: [
                  ...(model.service?.transformers ?? []),
                  {
                    id: modelTransformerEntityType.generateNewId(),
                    type: 'file',
                    fileRelationRef: relation.name,
                    category: {
                      name: constantCase(category.name),
                      maxFileSizeMb: category.maxFileSize,
                      authorize: {
                        uploadRoles: category.uploadRoles,
                      },
                      adapterRef: category.defaultAdapterRef,
                    },
                  },
                ],
              };
            }
          }
        },
      };
    },
  },
  {
    name: 'extract-categories-to-plugin-level',
    version: 3,
    migrate: (config, projectDefinition) => {
      interface TransformerWithCategory {
        type: string;
        category?: {
          name: string;
          maxFileSizeMb: number;
          authorize: { uploadRoles: string[] };
          adapterRef: string;
        };
        categoryRef?: string;
      }

      interface ProjectDefinitionConfig {
        models: {
          service?: {
            transformers?: TransformerWithCategory[];
          };
        }[];
      }

      const typedConfig = config as {
        storageFeatureRef: string;
        s3Adapters: {
          id: string;
          name: string;
          bucketConfigVar: string;
          hostedUrlConfigVar?: string;
        }[];
        fileCategories?: unknown[];
      };

      const def = projectDefinition as ProjectDefinitionConfig;

      // Collect all inline categories from file transformers, dedupe by name
      const categoryMap = new Map<
        string,
        {
          id: string;
          name: string;
          maxFileSizeMb: number;
          authorize: { uploadRoles: string[] };
          adapterRef: string;
        }
      >();

      for (const model of def.models) {
        const transformers =
          model.service?.transformers?.filter(
            (t) => t.type === 'file' && t.category,
          ) ?? [];
        for (const t of transformers) {
          if (!t.category) {
            continue;
          }
          const existing = categoryMap.get(t.category.name);
          if (existing) {
            if (
              existing.maxFileSizeMb !== t.category.maxFileSizeMb ||
              existing.adapterRef !== t.category.adapterRef ||
              JSON.stringify(existing.authorize) !==
                JSON.stringify(t.category.authorize)
            ) {
              throw new Error(
                `Duplicate file category name "${t.category.name}" found with conflicting settings across models`,
              );
            }
          } else {
            categoryMap.set(t.category.name, {
              id: fileCategoryEntityType.generateNewId(),
              name: t.category.name,
              maxFileSizeMb: t.category.maxFileSizeMb,
              authorize: t.category.authorize,
              adapterRef: t.category.adapterRef,
            });
          }
        }
      }

      return {
        updatedConfig: {
          ...typedConfig,
          fileCategories: [...categoryMap.values()],
        },
        updateProjectDefinition: (draft: unknown) => {
          const draftDef = draft as ProjectDefinitionConfig;

          // Replace inline category with categoryRef on each transformer
          for (const model of draftDef.models) {
            const transformers =
              model.service?.transformers?.filter(
                (t) => t.type === 'file' && t.category,
              ) ?? [];
            for (const t of transformers) {
              if (t.category) {
                t.categoryRef = t.category.name;
                t.category = undefined;
              }
            }
          }
        },
      };
    },
  },
];
