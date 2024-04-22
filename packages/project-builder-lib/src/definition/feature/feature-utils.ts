import { FeatureConfig, ProjectDefinition } from '@src/schema/index.js';

function getRootFeatures(
  projectDefinition: ProjectDefinition,
): FeatureConfig[] {
  return projectDefinition.features.filter((f) => !f.parentRef);
}

function getFeatureById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig | undefined {
  return projectDefinition.features.find((f) => f.id === featureId);
}

function getFeatureByIdOrThrow(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig {
  const feature = getFeatureById(projectDefinition, featureId);
  if (!feature) {
    throw new Error(`Could not find feature with ID ${featureId}`);
  }
  return feature;
}

function getFeatureChildren(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig[] {
  return projectDefinition.features.filter((f) => f.parentRef === featureId);
}

function getFeatureName(featureConfig: FeatureConfig): string {
  return featureConfig.name.split('/').pop() ?? '';
}

function getFeatureNameById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectDefinition, featureId);
  return getFeatureName(feature);
}

function getFeaturePathById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectDefinition, featureId);
  return feature.name;
}

export const FeatureUtils = {
  getRootFeatures,
  getFeatureById,
  getFeatureByIdOrThrow,
  getFeatureChildren,
  getFeatureName,
  getFeatureNameById,
  getFeaturePathById,
};
