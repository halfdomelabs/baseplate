import type { WebAppConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';
import { notEmpty } from '@baseplate-dev/utils';

import type { AppEntryBuilder } from '../../app-entry-builder.js';

import { compileAdminCrudSection } from './crud/index.js';

function compileAdminSections(
  featureId: string,
  builder: AppEntryBuilder<WebAppConfig>,
  sectionsId: string,
): GeneratorBundle[] | undefined {
  const { adminApp } = builder.appConfig;
  const sections = adminApp.sections.filter((s) => s.featureRef === featureId);

  if (sections.length === 0) {
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
  builder: AppEntryBuilder<WebAppConfig>,
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
    name: featureName,
    children: {
      $sections: sectionDescriptors,
      $childRoutes: subDescriptors,
      ...generatorsForFeature,
    },
  });
}

export function compileAdminFeatures(
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle[] {
  const { projectDefinition } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);

  return rootFeatures
    .flatMap((feature) => compileAdminFeatureRecursive(feature.id, builder))
    .filter(notEmpty);
}
