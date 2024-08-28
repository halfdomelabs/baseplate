import { produce } from 'immer';

import {
  FeatureConfig,
  featureEntityType,
} from '@src/schema/features/feature.js';
import {
  EmbeddedRelationTransformerConfig,
  ProjectDefinition,
  modelUniqueConstraintEntityType,
} from '@src/schema/index.js';

export interface SchemaMigration {
  version: number;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (config: any) => ProjectDefinition;
}

export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    version: 1,
    description: "Rename 'portBase' to 'portOffset' to project config",
    migrate: ({
      portBase,
      ...config
    }: ProjectDefinition & { portBase: number }) => ({
      ...config,
      portOffset: config.portOffset || portBase,
    }),
  },
  {
    version: 2,
    description: `Add parent IDs to features`,
    migrate: (config: ProjectDefinition) => {
      return produce((draftConfig: ProjectDefinition) => {
        const features: FeatureConfig[] = [];
        // find all features without a parent
        function addFeatureAndDescendents(parentFeature?: FeatureConfig): void {
          const children =
            draftConfig.features?.filter((f) =>
              parentFeature
                ? f.name.match(new RegExp(`^${parentFeature?.name}/[^/]+$`))
                : !f.name.includes('/'),
            ) ?? [];
          children.forEach((f) => {
            const newFeature: FeatureConfig = {
              id: featureEntityType.generateNewId(),
              name: f.name,
              parentRef: parentFeature?.name,
            };
            features.push(newFeature);
            addFeatureAndDescendents(newFeature);
          });
        }

        addFeatureAndDescendents();

        draftConfig.features = features;
      })(config);
    },
  },
  {
    version: 3,
    description: 'Add model to embedded transforms, file',
    migrate: (config: ProjectDefinition) => {
      return produce((draftConfig: ProjectDefinition) => {
        draftConfig.models = draftConfig.models ?? [];
        draftConfig.models.forEach((model) => {
          model.service?.transformers?.forEach((transformer) => {
            const oldTransformer = transformer as unknown as { name: string };
            if (transformer.type === 'embeddedRelation') {
              const embeddedTransformer =
                transformer as EmbeddedRelationTransformerConfig;
              const localRelationName = oldTransformer.name;
              const foreignModel = draftConfig.models?.find((m) =>
                m.model.relations?.some(
                  (relation) =>
                    relation.modelName === model.name &&
                    relation.foreignRelationName === localRelationName,
                ),
              );
              if (!foreignModel) {
                throw new Error(
                  `Could not find model associated with embedded relation ${model.name}/${localRelationName}`,
                );
              }
              embeddedTransformer.foreignRelationRef = oldTransformer.name;
              embeddedTransformer.modelRef = foreignModel.name;
            } else if (transformer.type === 'file') {
              (
                transformer as unknown as Record<string, unknown>
              ).fileRelationRef = oldTransformer.name;
            }
          });
        });
      })(config);
    },
  },
  {
    version: 4,
    description: 'Move storage into plugin system',
    migrate: (config: ProjectDefinition) => {
      interface OldStorage extends Record<string, unknown> {
        fileModel: string;
        featurePath: string;
      }
      return produce((draftConfig: ProjectDefinition) => {
        const draftConfigTyped = draftConfig as { storage?: OldStorage };
        const storage = draftConfigTyped.storage;
        if (!storage) {
          return;
        }
        const { featurePath, fileModel, ...storageConfig } = storage;
        draftConfig.plugins = draftConfig.plugins ?? [];
        draftConfig.plugins.push({
          id: 'halfdomelabs_baseplate-plugin-storage_storage',
          name: 'storage',
          packageName: '@halfdomelabs/baseplate-plugin-storage',
          version: '0.1.0',
          config: {
            fileModelRef: fileModel,
            featureRef: featurePath,
            ...storageConfig,
          },
        });
        draftConfigTyped.storage = undefined;
      })(config);
    },
  },
  {
    version: 5,
    description:
      'Store primary key in primaryKeyFieldRefs field and unique constraints in unique constraints field',
    migrate: (config: ProjectDefinition) => {
      interface OldField {
        isId?: boolean;
        isUnique?: boolean;
      }
      interface OldUniqueConstraint {
        name: string;
        fields: {
          name: string;
        }[];
      }
      return produce((draftConfig: ProjectDefinition) => {
        draftConfig.models = draftConfig.models ?? [];
        // set primary keys
        draftConfig.models.forEach((model) => {
          const oldModel = model.model as unknown as { primaryKeys?: string[] };
          model.model.primaryKeyFieldRefs = oldModel.primaryKeys ?? [];
          delete oldModel.primaryKeys;
          if (!model.model.primaryKeyFieldRefs?.length) {
            model.model.primaryKeyFieldRefs = model.model.fields
              .filter((f) => (f as OldField).isId)
              .map((f) => f.name);
          }
          model.model.fields.forEach((f) => {
            delete (f as OldField).isId;
          });
        });

        // clear up any isUnique fields
        draftConfig.models.forEach((model) => {
          const modelFields = model.model.fields;
          const uniqueFields = modelFields.filter(
            (f) => (f as OldField).isUnique,
          );
          if (model.model.uniqueConstraints) {
            model.model.uniqueConstraints = model.model.uniqueConstraints.map(
              (c) => {
                const oldConstraint = c as unknown as OldUniqueConstraint;
                return {
                  id: modelUniqueConstraintEntityType.generateNewId(),
                  fields: oldConstraint.fields.map((f) => ({
                    fieldRef: f.name,
                  })),
                };
              },
            );
          }
          if (uniqueFields.length) {
            const constraints = model.model.uniqueConstraints ?? [];
            model.model.uniqueConstraints = [
              ...constraints,
              ...model.model.fields
                .filter((f) => (f as OldField).isUnique)
                .map((f) => ({
                  id: modelUniqueConstraintEntityType.generateNewId(),
                  fields: [{ fieldRef: f.name }],
                })),
            ];
          }
          model.model.fields.forEach((f) => {
            delete (f as OldField).isUnique;
          });
        });
      })(config);
    },
  },
];
