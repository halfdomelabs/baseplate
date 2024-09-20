import { FeatureUtils, stripChildren } from '@halfdomelabs/project-builder-lib';

import { buildEnumsForFeature } from './enums.js';
import { buildGraphqlForFeature } from './graphql.js';
import { buildModelsForFeature } from './models.js';
import { buildServicesForFeature } from './services.js';
import { BackendAppEntryBuilder } from '../appEntryBuilder.js';

export function buildFeature(
  featureId: string,
  builder: BackendAppEntryBuilder,
): string {
  const { projectDefinition, parsedProject, appCompiler } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const descriptorLocation = `${feature.name}/root`;
  const featureName = FeatureUtils.getFeatureName(feature);
  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(
    projectDefinition,
    featureId,
  );

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@halfdomelabs/fastify/core/app-module',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featureId),
    children: stripChildren({
      $enums: buildEnumsForFeature(featureId, parsedProject),
      $models: buildModelsForFeature(builder, featureId),
      $services: buildServicesForFeature(builder, featureId),
      $graphql: buildGraphqlForFeature(builder, featureId),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature.id, builder),
      ),
      ...parsedProject.getFeatureChildren(featureId),
      ...appCompiler.getChildrenForFeature(featureId),
    }),
  });

  return descriptorLocation;
}
