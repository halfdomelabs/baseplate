import { AppEntryBuilder } from '../appEntryBuilder';
import { buildModelsForFeature } from './models';
import { buildSchemaTypesForFeature } from './schemaTypes';
import { buildServicesForFeature } from './services';

export function buildFeature(
  featurePath: string,
  builder: AppEntryBuilder
): unknown {
  const { projectConfig, parsedProject } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    projectConfig.features?.filter((f) =>
      f.name.startsWith(`${featurePath}/`)
    ) || [];

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@baseplate/fastify/core/app-module',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featurePath),
    children: {
      $models: buildModelsForFeature(featurePath, parsedProject),
      $services: buildServicesForFeature(featurePath, parsedProject),
      $schemaTypes: buildSchemaTypesForFeature(featurePath, parsedProject),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature.name, builder)
      ),
      ...parsedProject.getFeatureChildren(featurePath),
    },
  });

  return descriptorLocation;
}
