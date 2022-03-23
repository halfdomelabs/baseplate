import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildModelsForFeature } from './models';
import { buildSchemaTypesForFeature } from './schemaTypes';
import { buildServicesForFeature } from './services';

export function buildFeature(
  featurePath: string,
  builder: ProjectEntryBuilder
): unknown {
  const { appConfig } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    appConfig.features?.filter((f) => f.startsWith(`${featurePath}/`)) || [];

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@baseplate/fastify/core/app-module',
    children: {
      $models: buildModelsForFeature(featurePath, appConfig),
      $services: buildServicesForFeature(featurePath, appConfig),
      $schemaTypes: buildSchemaTypesForFeature(featurePath, appConfig),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature, builder)
      ),
    },
  });

  return descriptorLocation;
}
