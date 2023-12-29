import { FeatureConfig, ProjectConfig } from '@src/schema/index.js';

function getRootFeatures(projectConfig: ProjectConfig): FeatureConfig[] {
  return projectConfig.features.filter((f) => !f.parentRef);
}

function getFeatureById(
  projectConfig: ProjectConfig,
  featureId: string,
): FeatureConfig | undefined {
  return projectConfig.features.find((f) => f.id === featureId);
}

function getFeatureByIdOrThrow(
  projectConfig: ProjectConfig,
  featureId: string,
): FeatureConfig {
  const feature = getFeatureById(projectConfig, featureId);
  if (!feature) {
    throw new Error(`Could not find feature with ID ${featureId}`);
  }
  return feature;
}

function getFeatureChildren(
  projectConfig: ProjectConfig,
  featureId: string,
): FeatureConfig[] {
  return projectConfig.features.filter((f) => f.parentRef === featureId);
}

function getFeatureName(featureConfig: FeatureConfig): string {
  return featureConfig.name.split('/').pop() ?? '';
}

function getFeatureNameById(
  projectConfig: ProjectConfig,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectConfig, featureId);
  return getFeatureName(feature);
}

function getFeaturePathById(
  projectConfig: ProjectConfig,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectConfig, featureId);
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
