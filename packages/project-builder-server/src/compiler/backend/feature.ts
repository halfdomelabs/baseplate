import {
  FeatureUtils,
  stripEmptyGeneratorChildren,
} from '@halfdomelabs/project-builder-lib';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { buildEnumsForFeature } from './enums.js';
import { buildGraphqlForFeature } from './graphql.js';
import { buildModelsForFeature } from './models.js';
import { buildServicesForFeature } from './services.js';

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
    children: stripEmptyGeneratorChildren({
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
