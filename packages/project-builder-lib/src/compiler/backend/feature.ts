import { buildEnumsForFeature } from './enums.js';
import { buildModelsForFeature } from './models.js';
import { buildSchemaTypesForFeature } from './schemaTypes.js';
import { buildServicesForFeature } from './services.js';
import { BackendAppEntryBuilder } from '../appEntryBuilder.js';
import { FeatureUtils } from '@src/definition/feature/feature-utils.js';

export function buildFeature(
  featureId: string,
  builder: BackendAppEntryBuilder,
): unknown {
  const { projectConfig, parsedProject } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(projectConfig, featureId);
  const descriptorLocation = `${feature.name}/root`;
  const featureName = FeatureUtils.getFeatureName(feature);
  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(projectConfig, featureId);

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@halfdomelabs/fastify/core/app-module',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featureId),
    children: {
      $enums: buildEnumsForFeature(featureId, parsedProject),
      $models: buildModelsForFeature(builder, featureId),
      $services: buildServicesForFeature(builder, featureId),
      $schemaTypes: buildSchemaTypesForFeature(builder, featureId),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature.id, builder),
      ),
      ...parsedProject.getFeatureChildren(featureId),
    },
  });

  return descriptorLocation;
}
