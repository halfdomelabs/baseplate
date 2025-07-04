import type { WebAppConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';
import { notEmpty, safeMerge } from '@baseplate-dev/utils';

import type { AppEntryBuilder } from '../app-entry-builder.js';

function compileWebFeatureRecursive(
  featureId: string,
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle | undefined {
  const { projectDefinition } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const featureName = feature.name.split('/').pop();

  if (!featureName) {
    throw new Error('Feature name is required');
  }

  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(
    projectDefinition,
    featureId,
  );

  const subDescriptors = subFeatures
    .flatMap((subFeature) => compileWebFeatureRecursive(subFeature.id, builder))
    .filter(notEmpty);

  const generatorsForFeature =
    builder.appCompiler.getChildrenForFeature(featureId);

  return reactRoutesGenerator({
    name: featureName,
    children: safeMerge({ $childRoutes: subDescriptors }, generatorsForFeature),
  });
}

export function compileWebFeatures(
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle[] {
  const { projectDefinition } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);

  return rootFeatures
    .flatMap((feature) => compileWebFeatureRecursive(feature.id, builder))
    .filter(notEmpty);
}
