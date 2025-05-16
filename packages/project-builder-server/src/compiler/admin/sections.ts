import type { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import { FeatureUtils } from '@halfdomelabs/project-builder-lib';
import { reactRoutesGenerator } from '@halfdomelabs/react-generators';
import { notEmpty } from '@halfdomelabs/utils';

import type { AppEntryBuilder } from '../app-entry-builder.js';

import { compileAdminCrudSection } from './crud/index.js';

function compileAdminSections(
  featureId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  sectionsId: string,
): GeneratorBundle[] | undefined {
  const sections = builder.appConfig.sections?.filter(
    (s) => s.featureRef === featureId,
  );

  if (!sections?.length) {
    return undefined;
  }

  return sections.map((section) => {
    if ((section.type as string) === 'crud') {
      return compileAdminCrudSection(section, builder, sectionsId);
    }
    throw new Error(`Unknown section type ${section.type as string}`);
  });
}

function compileAdminFeatureRecursive(
  featureId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
): GeneratorBundle | undefined {
  const { projectDefinition } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const descriptorLocation = `${feature.name}/root`;
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
    .flatMap((subFeature) =>
      compileAdminFeatureRecursive(subFeature.id, builder),
    )
    .filter(notEmpty);

  const sectionDescriptors = compileAdminSections(
    featureId,
    builder,
    `${descriptorLocation}:$sections`,
  );

  if (subDescriptors.length === 0 && !sectionDescriptors) {
    return undefined;
  }

  const generatorsForFeature =
    builder.appCompiler.getChildrenForFeature(featureId);

  return reactRoutesGenerator({
    id: featureId,
    name: featureName,
    // add admin layout to any root features
    layoutKey: feature.parentRef ? undefined : 'admin',
    children: {
      $sections: sectionDescriptors,
      $childRoutes: subDescriptors,
      ...generatorsForFeature,
    },
  });
}

export function compileAdminFeatures(
  builder: AppEntryBuilder<AdminAppConfig>,
): GeneratorBundle[] {
  const { projectDefinition } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);

  return rootFeatures
    .flatMap((feature) => compileAdminFeatureRecursive(feature.id, builder))
    .filter(notEmpty);
}
