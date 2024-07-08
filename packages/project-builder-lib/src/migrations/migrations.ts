import { produce } from 'immer';

import {
  FeatureConfig,
  featureEntityType,
} from '@src/schema/features/feature.js';
import {
  EmbeddedRelationTransformerConfig,
  ProjectDefinition,
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
      return produce((draftConfig: ProjectDefinition) => {
        if (!draftConfig.storage) {
          return;
        }
        draftConfig.plugins = draftConfig.plugins ?? [];
        const { featurePath, fileModel, ...storageConfig } =
          draftConfig.storage;
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
        draftConfig.storage = undefined;
      })(config);
    },
  },
];
