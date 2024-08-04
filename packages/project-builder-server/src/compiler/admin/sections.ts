import {
  FeatureUtils,
  AdminAppConfig,
  stripChildren,
} from '@halfdomelabs/project-builder-lib';

import { compileAdminCrudSection } from './crud/index.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';
import { notEmpty } from '@src/utils/array.js';

export function compileAdminSections(
  featureId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  sectionsId: string,
): unknown[] | undefined {
  const sections = builder.appConfig.sections?.filter(
    (s) => s.feature === featureId,
  );

  if (!sections?.length) {
    return undefined;
  }

  return sections.map((section) => {
    switch (section.type) {
      case 'crud':
        return compileAdminCrudSection(section, builder, sectionsId);
      default:
        throw new Error(`Unknown section type ${section.type as string}`);
    }
  });
}

function compileAdminFeatureRecursive(
  featureId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
): unknown {
  const { projectDefinition, parsedProject } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const descriptorLocation = `${feature.name}/root`;
  const featureName = feature.name.split('/').pop();
  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(
    projectDefinition,
    featureId,
  );

  const subDescriptors = subFeatures
    .flatMap((subFeature) =>
      compileAdminFeatureRecursive(subFeature.id, builder),
    )
    .filter(notEmpty);

  const sectionDescriptors = compileAdminSections(
    featureId,
    builder,
    `${descriptorLocation}:$sections`,
  );

  if (!subDescriptors.length && !sectionDescriptors) {
    return undefined;
  }

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@halfdomelabs/react/core/react-routes',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featureId),
    // add admin layout to any root features
    layoutKey: feature.parentRef ? undefined : 'admin',
    children: stripChildren({
      $sections: sectionDescriptors,
      $childRoutes: subDescriptors,
    }),
  });

  return descriptorLocation;
}

export function compileAdminFeatures(
  builder: AppEntryBuilder<AdminAppConfig>,
): unknown[] {
  const { projectDefinition } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);

  return rootFeatures.flatMap((feature) =>
    compileAdminFeatureRecursive(feature.id, builder),
  );
}
