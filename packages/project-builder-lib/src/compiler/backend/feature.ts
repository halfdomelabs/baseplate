import { buildEnumsForFeature } from './enums.js';
import { buildModelsForFeature } from './models.js';
import { buildSchemaTypesForFeature } from './schemaTypes.js';
import { buildServicesForFeature } from './services.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';

export function buildFeature(
  featurePath: string,
  builder: AppEntryBuilder,
): unknown {
  const { projectConfig, parsedProject } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    projectConfig.features?.filter((f) =>
      f.name.startsWith(`${featurePath}/`),
    ) ?? [];

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@halfdomelabs/fastify/core/app-module',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featurePath),
    children: {
      $enums: buildEnumsForFeature(featurePath, parsedProject),
      $models: buildModelsForFeature(featurePath, parsedProject),
      $services: buildServicesForFeature(featurePath, parsedProject),
      $schemaTypes: buildSchemaTypesForFeature(featurePath, parsedProject),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature.name, builder),
      ),
      ...parsedProject.getFeatureChildren(featurePath),
    },
  });

  return descriptorLocation;
}
