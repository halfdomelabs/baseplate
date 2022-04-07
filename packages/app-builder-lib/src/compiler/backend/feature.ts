import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildModelsForFeature } from './models';
import { buildSchemaTypesForFeature } from './schemaTypes';
import { buildServicesForFeature } from './services';

export function buildFeature(
  featurePath: string,
  builder: ProjectEntryBuilder
): unknown {
  const { appConfig, parsedApp } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    appConfig.features?.filter((f) => f.startsWith(`${featurePath}/`)) || [];

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@baseplate/fastify/core/app-module',
    hoistedProviders: parsedApp.getFeatureHoistedProviders(featurePath),
    children: {
      $models: buildModelsForFeature(featurePath, parsedApp),
      $services: buildServicesForFeature(featurePath, parsedApp),
      $schemaTypes: buildSchemaTypesForFeature(featurePath, parsedApp),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature, builder)
      ),
      ...parsedApp.getFeatureChildren(featurePath),
    },
  });

  return descriptorLocation;
}
