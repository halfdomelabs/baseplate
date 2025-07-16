import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import { modelTransformerEntityType } from '@baseplate-dev/project-builder-lib';
import { constantCase } from 'es-toolkit';

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
    migrate: (config, _projectDefinition) => {
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
];
