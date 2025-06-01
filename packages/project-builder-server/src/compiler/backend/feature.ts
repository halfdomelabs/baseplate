import type { GeneratorBundle } from '@baseplate-dev/sync';

import { appModuleGenerator } from '@baseplate-dev/fastify-generators';
import { FeatureUtils } from '@baseplate-dev/project-builder-lib';
import { safeMergeAll } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { buildEnumsForFeature } from './enums.js';
import { buildGraphqlForFeature } from './graphql.js';
import { buildModelsForFeature } from './models.js';
import { buildServicesForFeature } from './services.js';

export function buildFeature(
  featureId: string,
  builder: BackendAppEntryBuilder,
): GeneratorBundle {
  const { projectDefinition, appCompiler } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const featureName = FeatureUtils.getFeatureName(feature);
  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(
    projectDefinition,
    featureId,
  );

  return appModuleGenerator({
    id: featureId,
    name: featureName,
    children: safeMergeAll(
      {
        enums: buildEnumsForFeature(featureId, projectDefinition),
        models: buildModelsForFeature(builder, featureId),
        services: buildServicesForFeature(builder, featureId),
        graphql: buildGraphqlForFeature(builder, featureId),
        submodules: subFeatures.map((subFeature) =>
          buildFeature(subFeature.id, builder),
        ),
      },
      appCompiler.getChildrenForFeature(featureId),
    ),
  });
}
