import { produce } from 'immer';

import {
  FeatureConfig,
  featureEntityType,
} from '@src/schema/features/feature.js';
import { ProjectConfig } from '@src/schema/index.js';

export interface SchemaMigration {
  version: number;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (config: any) => ProjectConfig;
}

export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    version: 1,
    description: "Rename 'portBase' to 'portOffset' to project config",
    migrate: ({
      portBase,
      ...config
    }: ProjectConfig & { portBase: number }) => ({
      ...config,
      portOffset: config.portOffset || portBase,
    }),
  },
  {
    version: 2,
    description: `Add parent IDs to features`,
    migrate: (config: ProjectConfig) => {
      return produce((draftConfig: ProjectConfig) => {
        const features: FeatureConfig[] = [];
        // find all features without a parent
        function addFeatureAndDescendents(parentFeature?: FeatureConfig): void {
          const children = draftConfig.features.filter((f) =>
            parentFeature
              ? f.name.match(new RegExp(`^${parentFeature?.name}/[^/]+$`))
              : !f.name.includes('/'),
          );
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
    migrate: (config: ProjectConfig) => {
      return produce((draftConfig: ProjectConfig) => {
        draftConfig.models.forEach((model) => {
          model.service?.transformers?.forEach((transformer) => {
            const oldTransformer = transformer as unknown as { name: string };
            if (transformer.type === 'embeddedRelation') {
              const localRelationName = oldTransformer.name;
              const foreignModel = draftConfig.models?.find(
                (m) =>
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
              transformer.foreignRelationRef = oldTransformer.name;
              transformer.modelRef = foreignModel.name;
            } else if (transformer.type === 'file') {
              transformer.fileRelationRef = oldTransformer.name;
            }
          });
        });
      })(config);
    },
  },
];
